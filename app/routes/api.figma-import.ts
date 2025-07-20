import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { FigmaService } from '~/lib/services/figmaService';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { figmaUrl, apiKey } = await request.json();

    if (!figmaUrl || !apiKey) {
      return json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const fileId = FigmaService.extractFileId(figmaUrl);

    if (!fileId) {
      return json({ error: 'Invalid Figma URL' }, { status: 400 });
    }

    const figmaService = new FigmaService(apiKey);
    const messages = await figmaService.convertToMessages(fileId);

    return json({ messages });
  } catch (error) {
    console.error('Figma import error:', error);
    return json({ error: error instanceof Error ? error.message : 'Failed to import Figma design' }, { status: 500 });
  }
}
