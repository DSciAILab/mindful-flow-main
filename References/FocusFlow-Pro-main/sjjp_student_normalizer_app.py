"""
SJJP Student List Normalizer
============================

This Streamlit application implements the complete pipeline described
in the conversation for cleaning and normalising student lists prior
to import into the SJJP system.  It accepts multiple uploaded files
(`.csv`, `.xlsx` or `.docx`), attempts to extract tabular data from
each, applies a number of data‐cleansing rules (normalising names,
dates, phone numbers, grades, sections, nationality and citizenship
status) and finally outputs a consolidated CSV in the exact format
expected by the system import template.

Limitations
-----------
* **`.xls` files are not supported.**  Pandas requires the optional
  `xlrd` package to read legacy Excel workbooks and the environment
  does not provide it.  Please save legacy workbooks as `.xlsx` or
  `.csv` before uploading.
* **PDF extraction is not implemented.**  The app only supports files
  with an inherent table structure (CSV, XLSX, DOCX).  Scanned PDFs
  should be processed through OCR or exported to CSV/XLSX prior to
  upload.
* **DOCX parsing is best effort.**  The application includes a
  lightweight parser that extracts the largest table from the Word
  document.  If your document contains multiple tables, ensure the
  desired student list is the largest one or save it as a separate
  file.

Usage
-----
Run the application with Streamlit (e.g. ``streamlit run
sjjp_student_normalizer_app.py``).  Upload your student lists, select
your preferred section formatting (letters, numbers or automatic
detection), optionally enter a school name for each file, then click
*Process Files* to download the normalised CSV(s).

The normalisation rules implemented here follow the guidelines
described by the user:

* **Names**: title case, honourifics removed.
* **Dates**: converted to ISO ``YYYY-MM-DD``.
* **Phones**: normalised to E.164 ``+971…``.  Mobile numbers starting
  with ``05`` are converted to ``+9715…``; landlines beginning with
  another digit after ``0`` are converted to ``+971…`` without the
  leading zero.  Non‑UAE numbers are retained if they start with a
  ``+``.
* **Gender**: values like ``M``, ``F``, ``Male`` and ``Female`` are
  mapped to ``Male`` or ``Female``.
* **Grade**: values such as ``G5``, ``Grade 5`` or ``5`` are
  normalised to the integer 5.  Grades outside 1–12 are treated as
  missing.
* **Section**: the pattern may be detected automatically (majority
  vote), or forced to letters or numbers.  Mixed patterns are
  reconciled so that all values follow the chosen style.  Advanced
  sections like ``ADV`` are preserved.
* **Nationality**: ``UAE``, ``United Arab Emirates`` and ``Emirati``
  are recorded simply as ``UAE``; any other value is kept as supplied
  (leading/trailing whitespace trimmed).  The citizenship status is
  derived: nationals are labelled ``UAE National`` and others
  ``Resident``.

Author: OpenAI ChatGPT
"""

import io
import re
import zipfile
from datetime import datetime
from typing import List, Optional, Tuple

import numpy as np
import pandas as pd
import streamlit as st
import xml.etree.ElementTree as ET


###############################################################################
# Helper functions for reading and parsing different file types
###############################################################################

def _docx_to_dataframe(file_bytes: bytes) -> Optional[pd.DataFrame]:
    """Extract the largest table from a DOCX file and return it as a DataFrame.

    The DOCX format is a zipped collection of XML documents.  This helper
    function opens the ``word/document.xml`` file, finds all table elements
    and selects the one with the most rows.  It then converts each row
    of the table to a list of cell texts and constructs a DataFrame using
    the first row as a header.  If no table is found the function
    returns ``None``.

    Parameters
    ----------
    file_bytes : bytes
        The raw bytes of the uploaded DOCX file.

    Returns
    -------
    pandas.DataFrame or None
        The extracted table as a DataFrame, or ``None`` if no table was
        detected.
    """
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            with z.open('word/document.xml') as doc_xml:
                xml_content = doc_xml.read()
    except Exception:
        return None

    try:
        tree = ET.fromstring(xml_content)
    except ET.ParseError:
        return None
    # WordprocessingML namespace
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    tables = tree.findall('.//w:tbl', ns)
    if not tables:
        return None
    # choose the table with the most rows
    best_tbl = max(tables, key=lambda tbl: len(tbl.findall('.//w:tr', ns)))
    rows = best_tbl.findall('.//w:tr', ns)
    if not rows:
        return None
    data_rows: List[List[str]] = []
    for row in rows:
        cells = row.findall('.//w:tc', ns)
        row_data: List[str] = []
        for cell in cells:
            # extract all text in the cell
            texts: List[str] = []
            for paragraph in cell.findall('.//w:p', ns):
                runs = paragraph.findall('.//w:t', ns)
                run_texts = [r.text or '' for r in runs]
                if run_texts:
                    texts.append(''.join(run_texts))
            cell_text = '\n'.join([t.strip() for t in texts if t.strip()])
            row_data.append(cell_text)
        data_rows.append(row_data)
    # Use the first row as header; pad shorter rows with empty strings
    header = data_rows[0]
    n_cols = len(header)
    body = [r + [''] * (n_cols - len(r)) if len(r) < n_cols else r[:n_cols] for r in data_rows[1:]]
    df = pd.DataFrame(body, columns=header)
    return df


def _read_uploaded_file(file) -> Tuple[Optional[pd.DataFrame], str]:
    """Read an uploaded file into a DataFrame.

    The function supports CSV, XLSX and DOCX formats.  Legacy Excel files
    (``.xls``) are not supported because the required ``xlrd`` package is
    unavailable in the current environment.  PDF extraction is also not
    supported.  The returned string describes any issue encountered while
    reading the file.  If the file was successfully read, the message
    will be an empty string.

    Parameters
    ----------
    file : UploadedFile
        The file uploaded via Streamlit.

    Returns
    -------
    tuple
        A 2‑tuple ``(df, error_message)`` where ``df`` is a DataFrame or
        ``None`` if reading failed, and ``error_message`` is a human
        readable explanation of the failure.
    """
    filename = file.name
    name_lower = filename.lower()
    try:
        if name_lower.endswith('.csv'):
            # Attempt to read with pandas; let pandas auto-detect encoding
            df = pd.read_csv(file, dtype=str)
            return df, ''
        elif name_lower.endswith('.xlsx'):
            # Use engine openpyxl to read XLSX
            df = pd.read_excel(file, dtype=str, engine='openpyxl')
            return df, ''
        elif name_lower.endswith('.xls'):
            # Unsupported legacy Excel
            return None, 'Legacy .xls files are not supported; please save as .xlsx or .csv.'
        elif name_lower.endswith('.docx'):
            file_bytes = file.getvalue()
            df = _docx_to_dataframe(file_bytes)
            if df is None:
                return None, 'No table was detected in the DOCX file.'
            return df, ''
        else:
            return None, f'Unsupported file type: {filename}'
    except Exception as exc:
        return None, f'Failed to read {filename}: {exc}'


###############################################################################
# Column mapping and normalisation
###############################################################################

# Synonyms mapping from various user-provided column names to our internal names.
# Keys should be lowercase, stripped of leading/trailing whitespace.
SYNONYMS = {
    'student number': 'Student No',
    'student no': 'Student No',
    'student id': 'Student No',
    'id': 'Student No',
    'std no': 'Student No',
    'std num': 'Student No',
    'admission no': 'Student No',
    'admission number': 'Student No',
    # Student name (English)
    'student name (english)': 'Student Name',
    'student name': 'Student Name',
    'name': 'Student Name',
    'full name': 'Student Name',
    'studentname': 'Student Name',
    # Student name (Arabic)
    'student name (arabic)': 'Student Name (Arabic)',
    'arabic name': 'Student Name (Arabic)',
    'student arabic name': 'Student Name (Arabic)',
    # Gender
    'gender': 'Gender',
    'sex': 'Gender',
    'm/f': 'Gender',
    'sex (m/f)': 'Gender',
    # Date of birth
    'date of birth': 'Date Of Birth',
    'dob': 'Date Of Birth',
    'birthdate': 'Date Of Birth',
    'birth date': 'Date Of Birth',
    'dateofbirth': 'Date Of Birth',
    # Place of birth (unused in import template but kept internally)
    'place of birth': 'Place of Birth',
    'pob': 'Place of Birth',
    'birth place': 'Place of Birth',
    # Nationality / Country
    'nationality': 'Nationality',
    'nationality (en)': 'Nationality',
    'country': 'Nationality',
    # Citizenship status / group
    'citizenship status': 'Citizenship Status',
    'citizenship': 'Citizenship Status',
    'citizenship group': 'Citizenship Status',
    'residency status': 'Citizenship Status',
    'nationality group': 'Citizenship Status',
    # Grade / class
    'grade': 'Grade',
    'class': 'Grade',
    'year': 'Grade',
    'grade level': 'Grade',
    'g': 'Grade',
    'g.': 'Grade',
    # Section / homeroom
    'section': 'Section',
    'section / home room': 'Section',
    'homeroom': 'Section',
    'homeroom (section)': 'Section',
    'classroom': 'Section',
    # Cycle (unused in import template but may be derived)
    'cycle': 'Cycle',
    # Emirate ID / EID
    'emirates id': 'Emirate Id',
    'emirates id number': 'Emirate Id',
    'emirate id': 'Emirate Id',
    'eid': 'Emirate Id',
    'eid number': 'Emirate Id',
    # Passport
    'passport': 'Passport',
    'passport no': 'Passport',
    'passport number': 'Passport',
    # Home address
    'address': 'Home Address',
    'home address': 'Home Address',
    'address home': 'Home Address',
    # Student mobile / phone
    'student mobile number': 'Student Phone',
    'student mobile': 'Student Phone',
    'student phone': 'Student Phone',
    'student phone number': 'Student Phone',
    'mobile': 'Student Phone',  # ambiguous but treat as student phone
    'phone': 'Student Phone',
    # Parent mobile / phone
    'parent mobile number': 'Parent Phone',
    'parent mobile': 'Parent Phone',
    'parent phone': 'Parent Phone',
    'parent phone number': 'Parent Phone',
    # Student email
    'student email': 'Student Email',
    'student e-mail': 'Student Email',
    'student mail': 'Student Email',
    # Parent email
    'parent email': 'Parent Email',
    'parent e-mail': 'Parent Email',
    # Generic email
    'email': 'Email',
    'e-mail': 'Email',
}


def _standardise_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """Map arbitrary column names to our internal standard.

    The function lowercases, strips and condenses whitespace in the
    original column names before looking them up in the ``SYNONYMS``
    dictionary.  If no mapping is found the original column name is
    retained unchanged.

    Parameters
    ----------
    df : pandas.DataFrame
        The input DataFrame whose columns should be renamed.

    Returns
    -------
    pandas.DataFrame
        The DataFrame with renamed columns.
    """
    rename_map = {}
    for col in df.columns:
        key = re.sub(r'\s+', ' ', str(col).strip().lower())
        standard = SYNONYMS.get(key, None)
        if standard:
            rename_map[col] = standard
    if rename_map:
        df = df.rename(columns=rename_map)
    return df


###############################################################################
# Normalisation helpers
###############################################################################

HONORIFICS = [
    'mr.', 'mr ', 'mrs.', 'mrs ', 'ms.', 'ms ', 'dr.', 'dr ', 'prof.', 'prof ',
    'eng.', 'eng ', 'sheikh', 'sheik', 'sheikh ', 'sheik ', 'sheikha', 'sheikha ',
    'miss ', 'sir ', 'madam ', 'engineer ', 'doctor '
]


def _clean_name(name: str) -> str:
    """Normalise a person's name.

    * Converts to title case.
    * Removes common honourifics and extraneous whitespace.

    Parameters
    ----------
    name : str
        The raw name value.

    Returns
    -------
    str
        The cleaned name.  Empty input yields an empty string.
    """
    if not name or not isinstance(name, str):
        return ''
    name = name.strip()
    name_lower = name.lower()
    for hon in HONORIFICS:
        if name_lower.startswith(hon):
            # remove the honourific at the beginning
            name = name[len(hon):].lstrip()
            name_lower = name.lower()
            break
    # condense multiple spaces
    name = re.sub(r'\s+', ' ', name)
    # title case (handles apostrophes, hyphens)
    def title_special(s: str) -> str:
        return '-'.join(part.capitalize() for part in s.split('-'))
    name_parts = name.split(' ')
    cleaned_parts = [title_special(part) for part in name_parts]
    return ' '.join(cleaned_parts)


def _clean_date(value: str) -> Optional[str]:
    """Parse various date formats and return ISO ``YYYY-MM-DD``.

    Accepts common patterns such as ``DD/MM/YYYY``, ``DD-MM-YYYY``,
    ``YYYY-MM-DD`` and textual month names (e.g. ``1 January 2010``).
    Invalid or missing dates return ``None``.
    """
    if not value or not isinstance(value, str):
        return None
    value = value.strip()
    if value == '' or value.lower() in {'nan', 'none', 'null'}:
        return None
    # try using pandas to_datetime, which handles many formats
    try:
        # Day first to handle DD/MM/YYYY
        dt = pd.to_datetime(value, dayfirst=True, errors='coerce')
        if pd.isnull(dt):
            return None
        return dt.strftime('%Y-%m-%d')
    except Exception:
        return None


def _clean_gender(value: str) -> Optional[str]:
    """Normalise gender values to ``Male`` or ``Female``.

    Accepts abbreviations and various case combinations.
    Returns ``None`` for unrecognised or missing values.
    """
    if not value or not isinstance(value, str):
        return None
    value = value.strip().lower()
    if value in {'m', 'male'}:
        return 'Male'
    if value in {'f', 'female'}:
        return 'Female'
    return None


def _extract_digits(s: str) -> str:
    """Return only the digits from a string."""
    return ''.join(ch for ch in s if ch.isdigit())


def _clean_phone(value: str) -> Optional[str]:
    """Normalise a phone number string to E.164 where possible.

    The function attempts to handle multiple numbers separated by commas,
    semicolons or slashes by returning the first valid entry.  Mobile
    numbers beginning with ``05`` (or ``5``) are converted to ``+9715…``;
    landlines beginning with ``0`` followed by a digit other than ``5``
    are converted to ``+971X…`` (leading zero removed).  Numbers already
    starting with ``971`` are prefixed with ``+``.  If a number begins
    with ``+`` it is assumed to already be in international format and
    returned unchanged (after removing spaces).  Inputs with no valid
    digits yield ``None``.
    """
    if not value or not isinstance(value, str):
        return None
    # Split on common delimiters to support multiple phone numbers
    parts = re.split(r'[;,/\s]+', value.strip())
    for part in parts:
        if not part:
            continue
        part_stripped = part.strip()
        # If already starts with +, assume valid international format
        if part_stripped.startswith('+'):
            # remove spaces and dashes
            cleaned = re.sub(r'[^\d+]', '', part_stripped)
            return cleaned
        digits = _extract_digits(part_stripped)
        if not digits:
            continue
        # UAE mobile: starts with 5 or 05
        if digits.startswith('05'):
            if len(digits) == 10:
                # 05XXXXXXXX
                return '+971' + digits[1:]
        elif digits.startswith('5') and len(digits) == 9:
            # 5XXXXXXXX
            return '+971' + digits
        # UAE landline: 02XXXXXXX or similar (leading 0)
        elif digits.startswith('0') and len(digits) in {8, 9}:
            # drop the leading zero
            return '+971' + digits[1:]
        # Already starts with 971 (without plus)
        elif digits.startswith('971'):
            return '+' + digits
        # International number starting with country code (at least 9 digits)
        elif len(digits) >= 9:
            # Prepend + if missing
            return '+' + digits
        # Fallback: return digits as is with +
        return '+' + digits
    return None


def _clean_grade(value: str) -> Optional[int]:
    """Extract the numeric grade from diverse representations.

    Accepts strings like ``Grade 5``, ``G5``, ``G-5`` and ``5``.  Returns
    an integer between 1 and 12 or ``None`` if not recognised.
    """
    if not value or not isinstance(value, str):
        return None
    value = value.strip()
    # Remove any prefix like 'Grade', 'G', 'G-' and keep digits
    match = re.search(r'(?:[Gg][- ]?)?(\d{1,2})', value)
    if match:
        num = int(match.group(1))
        if 1 <= num <= 12:
            return num
    return None


def _clean_section(value: str) -> Optional[str]:
    """Normalise a section string by stripping spaces/hyphens and uppercasing.

    The function returns ``None`` for empty or invalid inputs.  It does
    not convert numeric/alpha values to a consistent pattern; that is
    handled later based on the user's selection or automatic detection.
    """
    if not value or not isinstance(value, str):
        return None
    v = value.strip().replace('-', '').replace(' ', '')
    if v == '':
        return None
    return v.upper()


def _detect_section_pattern(values: List[str]) -> str:
    """Detect whether section identifiers are mostly letters or numbers.

    Returns ``'letters'`` if the majority of non-ADV values are single
    alphabetic characters, ``'numbers'`` if they are single digits,
    otherwise defaults to ``'letters'``.  Advanced identifiers such as
    ``ADV`` are ignored for the purposes of this detection.
    """
    letter_count = 0
    number_count = 0
    for v in values:
        if not v or v.upper() == 'ADV':
            continue
        if re.fullmatch(r'[A-Z]', v):
            letter_count += 1
        elif re.fullmatch(r'\d', v):
            number_count += 1
    if letter_count >= number_count:
        return 'letters'
    return 'numbers'


def _convert_section(value: Optional[str], target_pattern: str) -> Optional[str]:
    """Convert a section value to the target pattern.

    If ``target_pattern`` is ``'letters'``, numeric single-digit values
    (e.g. ``'1'``) are mapped to ``'A'`` (1→A, 2→B, ...).  If
    ``target_pattern`` is ``'numbers'`` then single letters (A→1,
    B→2, ...) are mapped accordingly.  Values not fitting these
    single-character patterns are returned unchanged.  Values of ``None``
    remain ``None``.
    """
    if value is None:
        return None
    if value.upper() == 'ADV':
        return 'ADV'
    if target_pattern == 'letters':
        # convert digits to letters
        if re.fullmatch(r'\d', value):
            num = int(value)
            # Map 1→A, 2→B, etc.  If num out of range, return as is
            if 1 <= num <= 26:
                return chr(ord('A') + num - 1)
        # already letter or complex string: return uppercase letter(s)
        return value.upper()
    elif target_pattern == 'numbers':
        # convert single letter to number
        if re.fullmatch(r'[A-Za-z]', value):
            num = ord(value.upper()) - ord('A') + 1
            return str(num)
        # already numeric or complex: return as is
        return value
    else:
        # unknown target pattern, return original
        return value


def _clean_nationality(value: str) -> Optional[str]:
    """Normalise nationality to ``UAE`` when matching Emirati labels.

    Matches against case‑insensitive forms of ``UAE``, ``United Arab
    Emirates`` and ``Emirati``.  Otherwise returns the original value
    stripped of whitespace.  Empty or null values yield ``None``.
    """
    if not value or not isinstance(value, str):
        return None
    v = value.strip()
    if v == '':
        return None
    v_lower = v.lower()
    if v_lower in {'uae', 'united arab emirates', 'emirati'}:
        return 'UAE'
    return v


def _derive_citizenship_status(nationality: Optional[str]) -> Optional[str]:
    """Derive citizenship status from the normalised nationality.

    ``UAE`` nationals become ``UAE National``; all others (including
    ``None``) become ``Resident``.  ``None`` may be returned for
    missing nationality inputs.
    """
    if nationality is None:
        return None
    if nationality == 'UAE':
        return 'UAE National'
    return 'Resident'


def _derive_cycle(grade: Optional[int]) -> Optional[str]:
    """Derive the educational cycle from the grade.

    Grades 1–4 map to ``C1``, 5–8 to ``C2`` and 9–12 to ``C3``.  Null
    grades produce ``None``.
    """
    if grade is None:
        return None
    if 1 <= grade <= 4:
        return 'C1'
    if 5 <= grade <= 8:
        return 'C2'
    if 9 <= grade <= 12:
        return 'C3'
    return None


def _normalise_dataframe(df: pd.DataFrame, section_pattern_option: str) -> pd.DataFrame:
    """Apply normalisation rules to the DataFrame.

    The function standardises column names, cleans individual fields,
    derives additional columns and resolves sections to a consistent
    pattern.  A new DataFrame is returned with columns relevant to
    import.  Any extra columns from the input are preserved unless they
    conflict with the import template.

    Parameters
    ----------
    df : pandas.DataFrame
        The raw DataFrame extracted from the uploaded file.
    section_pattern_option : str
        One of ``'auto'``, ``'letters'`` or ``'numbers'``.  ``'auto'``
        performs a majority vote detection on the section column; the
        others force conversion to the specified pattern.

    Returns
    -------
    pandas.DataFrame
        A new DataFrame with normalised columns and values.
    """
    # Rename columns based on synonyms
    df = _standardise_column_names(df.copy())

    # Ensure required columns exist; create empty ones if missing
    required_internal_cols = [
        'Student No', 'Student Name', 'Student Name (Arabic)', 'Grade',
        'Section', 'Gender', 'Nationality', 'Citizenship Status', 'Date Of Birth',
        'Parent Phone', 'Student Phone', 'Emirate Id', 'Passport',
        'Home Address', 'Student Email', 'Parent Email', 'Email'
    ]
    for col in required_internal_cols:
        if col not in df.columns:
            df[col] = None

    # Clean names
    df['Student Name'] = df['Student Name'].apply(_clean_name)
    if 'Student Name (Arabic)' in df.columns:
        df['Student Name (Arabic)'] = df['Student Name (Arabic)'].fillna('').astype(str)
    else:
        df['Student Name (Arabic)'] = ''

    # Clean gender
    df['Gender'] = df['Gender'].apply(_clean_gender)

    # Clean date of birth
    df['Date Of Birth'] = df['Date Of Birth'].apply(_clean_date)

    # Clean grade
    df['Grade'] = df['Grade'].apply(lambda v: _clean_grade(str(v)) if pd.notnull(v) else None)

    # Clean section (basic normalisation)
    df['Section'] = df['Section'].apply(lambda v: _clean_section(str(v)) if pd.notnull(v) else None)

    # Clean nationality
    df['Nationality'] = df['Nationality'].apply(_clean_nationality)

    # Derive citizenship status from nationality
    df['Citizenship Status'] = df['Nationality'].apply(_derive_citizenship_status)

    # Clean phones: Parent and Student
    df['Parent Phone'] = df['Parent Phone'].apply(_clean_phone)
    df['Student Phone'] = df['Student Phone'].apply(_clean_phone)

    # Clean email fields
    df['Student Email'] = df['Student Email'].fillna('').astype(str).str.strip().str.lower()
    df['Parent Email'] = df['Parent Email'].fillna('').astype(str).str.strip().str.lower()
    df['Email'] = df['Email'].fillna('').astype(str).str.strip().str.lower()

    # Clean Emirate Id, Passport, Home Address (remove whitespace)
    df['Emirate Id'] = df['Emirate Id'].fillna('').astype(str).str.strip()
    df['Passport'] = df['Passport'].fillna('').astype(str).str.strip()
    df['Home Address'] = df['Home Address'].fillna('').astype(str).str.strip()

    # Determine section pattern
    section_values = df['Section'].dropna().tolist()
    if section_pattern_option == 'auto':
        pattern = _detect_section_pattern(section_values)
    elif section_pattern_option == 'letters':
        pattern = 'letters'
    else:
        pattern = 'numbers'
    # Convert section values
    df['Section'] = df['Section'].apply(lambda v: _convert_section(v, pattern))

    # Derive cycle
    df['Cycle'] = df['Grade'].apply(_derive_cycle)

    # Determine import email: prioritise Student Email ending with @ese.gov.ae
    def choose_email(row):
        student_email = row.get('Student Email') or ''
        parent_email = row.get('Parent Email') or ''
        generic_email = row.get('Email') or ''
        # prefer government email for student
        if student_email and student_email.endswith('@ese.gov.ae'):
            return student_email
        # if student email exists (non-gov), use it
        if student_email:
            return student_email
        # else use parent email
        if parent_email:
            return parent_email
        # else use generic email if provided
        if generic_email:
            return generic_email
        return ''
    df['Import Email'] = df.apply(choose_email, axis=1)

    return df


def _to_import_format(df: pd.DataFrame) -> pd.DataFrame:
    """Create a DataFrame in the exact format required for system import.

    The output columns and their sources are:

    * ``Student No`` ← Student No
    * ``Student Name`` ← Student Name
    * ``Student Name (Arabic)`` ← Student Name (Arabic)
    * ``Grade`` ← Grade (int)
    * ``Section / Home Room`` ← Section
    * ``Gender`` ← Gender
    * ``Nationality Group / Citizenship Status`` ← Citizenship Status
    * ``Nationality`` ← Nationality
    * ``Date Of Birth`` ← Date Of Birth
    * ``Parent Phone`` ← Parent Phone
    * ``Student Phone`` ← Student Phone
    * ``Emirate Id`` ← Emirate Id
    * ``Passport`` ← Passport
    * ``Home Address`` ← Home Address
    * ``Email`` ← Import Email

    Missing or null values are filled with empty strings.

    Parameters
    ----------
    df : pandas.DataFrame
        The normalised DataFrame.

    Returns
    -------
    pandas.DataFrame
        The DataFrame formatted for import.
    """
    import_df = pd.DataFrame()
    import_df['Student No'] = df['Student No'].fillna('').astype(str)
    import_df['Student Name'] = df['Student Name'].fillna('')
    import_df['Student Name (Arabic)'] = df['Student Name (Arabic)'].fillna('')
    # Grade: convert None to blank string
    import_df['Grade'] = df['Grade'].apply(lambda g: str(g) if pd.notnull(g) else '')
    import_df['Section / Home Room'] = df['Section'].fillna('')
    import_df['Gender'] = df['Gender'].fillna('')
    import_df['Nationality Group / Citizenship Status'] = df['Citizenship Status'].fillna('')
    import_df['Nationality'] = df['Nationality'].fillna('')
    import_df['Date Of Birth'] = df['Date Of Birth'].fillna('')
    import_df['Parent Phone'] = df['Parent Phone'].fillna('')
    import_df['Student Phone'] = df['Student Phone'].fillna('')
    import_df['Emirate Id'] = df['Emirate Id'].fillna('')
    import_df['Passport'] = df['Passport'].fillna('')
    import_df['Home Address'] = df['Home Address'].fillna('')
    import_df['Email'] = df['Import Email'].fillna('')
    return import_df


###############################################################################
# Streamlit application entry point
###############################################################################

def main() -> None:
    st.set_page_config(page_title="SJJP Student List Normalizer", layout="wide")
    st.title("SJJP Student List Normalizer and Import Tool")

    st.markdown(
        """
        Upload one or more student list files below.  Accepted formats are
        **CSV**, **XLSX** and **DOCX**.  Legacy **.xls** files and PDFs
        are not supported.  The application will normalise the data
        according to SJJP rules and produce a CSV ready for import.
        """
    )

    uploaded_files = st.file_uploader(
        "Select files to process",
        type=["csv", "xlsx", "docx"],
        accept_multiple_files=True,
    )

    section_pattern_option = st.selectbox(
        "Section pattern", options=["auto", "letters", "numbers"], index=0,
        format_func=lambda opt: {
            'auto': 'Auto detect (majority)',
            'letters': 'Letters (A, B, C …)',
            'numbers': 'Numbers (1, 2, 3 …)'
        }[opt]
    )

    if not uploaded_files:
        st.info("Please upload at least one file to begin.")
        return

    # Process each file upon button click
    if st.button("Process Files"):
        consolidated_outputs = []  # list of (school_name, import_df)
        error_messages = []
        for file in uploaded_files:
            filename = file.name
            with st.spinner(f"Processing {filename}…"):
                df, err = _read_uploaded_file(file)
                if df is None:
                    error_messages.append(f"{filename}: {err}")
                    continue
                # Ask the user for the school name (optional)
                # Use filename (without extension) as default
                default_school = re.sub(r'\.[^.]+$', '', filename)
                school_name = st.text_input(
                    f"School name for {filename}", value=default_school,
                    key=f"school_{filename}"
                )
                # Apply normalisation rules
                normalised_df = _normalise_dataframe(df, section_pattern_option)
                # Convert to import format
                import_df = _to_import_format(normalised_df)
                # Preview
                st.subheader(f"Preview of normalised data for {filename} ({school_name})")
                st.dataframe(import_df.head(10))
                # Save for consolidation
                consolidated_outputs.append((school_name, import_df))
        # Report errors if any
        if error_messages:
            st.error("\n".join(error_messages))
        # Prepare consolidated outputs
        if consolidated_outputs:
            # Group by school and concatenate
            grouped = {}
            for school, df_out in consolidated_outputs:
                grouped.setdefault(school, []).append(df_out)
            for school, dfs in grouped.items():
                full_df = pd.concat(dfs, ignore_index=True)
                # Create CSV in memory
                csv_buffer = io.StringIO()
                full_df.to_csv(csv_buffer, index=False)
                csv_data = csv_buffer.getvalue().encode('utf-8')
                st.download_button(
                    label=f"Download {school}_Import.csv",
                    data=csv_data,
                    file_name=f"{school}_Import.csv",
                    mime='text/csv',
                )


# Run the app if executed as a script
if __name__ == "__main__":
    main()
