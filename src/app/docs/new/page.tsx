import type { Metadata } from 'next';
import { CreatePageForm } from '@/components/create-page-form';

export const metadata: Metadata = {
  title: 'Create New Page',
  description: 'Submit a new page to the Relay wiki',
};

export default function NewPage() {
  return (
    <div className="container max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-fd-foreground mb-2">Create New Page</h1>
      <p className="text-fd-muted-foreground mb-8">
        Fill out the form below to propose a new wiki page. Your submission will create a pull
        request for review before it goes live.
      </p>
      <CreatePageForm />
    </div>
  );
}
