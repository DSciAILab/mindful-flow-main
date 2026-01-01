"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Reusable Skeleton Components ---

const HeaderSkeleton = () => (
  <header className="p-4 border-b border-border">
    <Skeleton className="h-8 w-48 rounded-md" />
  </header>
);

const ListItemSkeleton = () => (
  <div className="flex items-center justify-between p-3 border rounded-md">
    <div className="flex items-center gap-2">
      <Skeleton className="h-6 w-32 rounded-md" />
      <Skeleton className="h-4 w-20 rounded-md" />
    </div>
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  </div>
);

const CardWithListSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-7 w-40 rounded-md" />
    </CardHeader>
    <CardContent className="space-y-3">
      <ListItemSkeleton />
      <ListItemSkeleton />
      <ListItemSkeleton />
    </CardContent>
  </Card>
);

// --- Page-Specific Skeletons ---

export const IndexPageSkeleton = () => (
  <Layout>
    <div className="flex items-center justify-between p-4 border-b">
      <div>
        <Skeleton className="h-4 w-40 mb-2 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
    <main className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-1/2 rounded-md" />
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Skeleton className="h-20 w-48 rounded-md" />
          <div className="flex space-x-2">
            <Skeleton className="h-16 w-16 rounded-md" />
            <Skeleton className="h-16 w-16 rounded-md" />
            <Skeleton className="h-16 w-16 rounded-md" />
          </div>
        </CardContent>
      </Card>
      <CardWithListSkeleton />
    </main>
  </Layout>
);

export const InboxPageSkeleton = () => (
  <Layout>
    <HeaderSkeleton />
    <main className="p-4">
      <Tabs defaultValue="todo" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="todo">Tarefas a Fazer</TabsTrigger>
          <TabsTrigger value="projects">Projetos</TabsTrigger>
          <TabsTrigger value="completed">Tarefas Realizadas</TabsTrigger>
        </TabsList>
        <TabsContent value="todo" className="mt-4 space-y-4">
          <CardWithListSkeleton />
          <CardWithListSkeleton />
        </TabsContent>
      </Tabs>
    </main>
  </Layout>
);

export const HabitsPageSkeleton = () => (
  <Layout>
    <HeaderSkeleton />
    <main className="p-4">
      <CardWithListSkeleton />
    </main>
  </Layout>
);

export const ReviewPageSkeleton = () => (
  <Layout>
    <HeaderSkeleton />
    <main className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-40 rounded-md" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
        </CardContent>
      </Card>
      <CardWithListSkeleton />
    </main>
  </Layout>
);

export const ProfilePageSkeleton = () => (
  <Layout>
    <HeaderSkeleton />
    <main className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-40 rounded-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 rounded-md" />
              <Skeleton className="h-4 w-64 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-40 rounded-md" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
        </CardContent>
      </Card>
    </main>
  </Layout>
);