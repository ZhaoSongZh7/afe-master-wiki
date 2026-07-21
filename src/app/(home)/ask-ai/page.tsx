import type { Metadata } from 'next';
import { AskAiChat } from '@/components/ask-ai-chat';

export const metadata: Metadata = {
  title: 'Ask AI | AFE Handbook',
  description: 'Ask questions and find information in the AFE Handbook.',
};

export default function AskAiPage() {
  return <AskAiChat />;
}
