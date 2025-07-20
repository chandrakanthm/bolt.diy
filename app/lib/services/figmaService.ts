import type { Message } from 'ai';

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  backgroundColor?: { r: number; g: number; b: number; a: number };
  fills?: Array<{ color?: { r: number; g: number; b: number; a: number } }>;
  strokes?: Array<{ color?: { r: number; g: number; b: number; a: number } }>;
  strokeWeight?: number;
  cornerRadius?: number;
  effects?: Array<{ type: string; color?: { r: number; g: number; b: number; a: number } }>;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  constraints?: { horizontal: string; vertical: string };
  layoutMode?: string;
  primaryAxisSizingMode?: string;
  counterAxisSizingMode?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  layoutAlign?: string;
  layoutGrow?: number;
  clipsContent?: boolean;
  characters?: string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    lineHeightPx?: number;
    letterSpacing?: number;
    textAlignHorizontal?: string;
    textAlignVertical?: string;
  };
}

export interface FigmaFile {
  document: FigmaNode;
  components: Record<string, any>;
  styles: Record<string, any>;
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
}

export class FigmaService {
  private _apiKey: string;
  private _baseUrl = 'https://api.figma.com/v1';

  constructor(apiKey: string) {
    this._apiKey = apiKey;
  }

  /**
   * Extract file ID from Figma URL
   */
  static extractFileId(url: string): string | null {
    const patterns = [
      /figma\.com\/file\/([a-zA-Z0-9-]{15,})\//, // Standard file URL with trailing slash
      /figma\.com\/design\/([a-zA-Z0-9-]{15,})\//, // Design file URL with trailing slash
      /figma\.com\/proto\/([a-zA-Z0-9-]{15,})\//, // Prototype URL with trailing slash
      /figma\.com\/file\/([a-zA-Z0-9-]{15,})$/, // Standard file URL at end
      /figma\.com\/design\/([a-zA-Z0-9-]{15,})$/, // Design file URL at end
      /figma\.com\/proto\/([a-zA-Z0-9-]{15,})$/, // Prototype URL at end
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);

      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Fetch Figma file data
   */
  async fetchFile(fileId: string): Promise<FigmaFile> {
    const response = await fetch(`${this._baseUrl}/files/${fileId}`, {
      headers: {
        'X-Figma-Token': this._apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid Figma API key. Please check your API key.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Please check file permissions.');
      } else if (response.status === 404) {
        throw new Error('Figma file not found. Please check the URL.');
      }

      throw new Error(`Failed to fetch Figma file: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return data;
  }

  /**
   * Convert RGB color to CSS
   */
  private _rgbToCSS(color: { r: number; g: number; b: number; a?: number }): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = color.a !== undefined ? color.a : 1;

    if (a < 1) {
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Generate CSS styles for a node
   */
  private _generateCSS(node: FigmaNode): string {
    const styles: string[] = [];

    // Background color
    if (node.backgroundColor) {
      styles.push(`background-color: ${this._rgbToCSS(node.backgroundColor)}`);
    } else if (node.fills && node.fills.length > 0 && node.fills[0].color) {
      styles.push(`background-color: ${this._rgbToCSS(node.fills[0].color)}`);
    }

    // Border
    if (node.strokes && node.strokes.length > 0 && node.strokes[0].color) {
      const strokeWidth = node.strokeWeight || 1;

      styles.push(`border: ${strokeWidth}px solid ${this._rgbToCSS(node.strokes[0].color)}`);
    }

    // Border radius
    if (node.cornerRadius) {
      styles.push(`border-radius: ${node.cornerRadius}px`);
    }

    // Layout properties
    if (node.layoutMode === 'HORIZONTAL') {
      styles.push('display: flex');
      styles.push('flex-direction: row');
    } else if (node.layoutMode === 'VERTICAL') {
      styles.push('display: flex');
      styles.push('flex-direction: column');
    }

    // Padding
    if (node.paddingTop || node.paddingRight || node.paddingBottom || node.paddingLeft) {
      const top = node.paddingTop || 0;
      const right = node.paddingRight || 0;
      const bottom = node.paddingBottom || 0;
      const left = node.paddingLeft || 0;
      styles.push(`padding: ${top}px ${right}px ${bottom}px ${left}px`);
    }

    // Gap (item spacing)
    if (node.itemSpacing) {
      styles.push(`gap: ${node.itemSpacing}px`);
    }

    // Size
    if (node.absoluteBoundingBox) {
      styles.push(`width: ${node.absoluteBoundingBox.width}px`);
      styles.push(`height: ${node.absoluteBoundingBox.height}px`);
    }

    // Typography
    if (node.style) {
      if (node.style.fontFamily) {
        styles.push(`font-family: "${node.style.fontFamily}"`);
      }

      if (node.style.fontSize) {
        styles.push(`font-size: ${node.style.fontSize}px`);
      }

      if (node.style.fontWeight) {
        styles.push(`font-weight: ${node.style.fontWeight}`);
      }

      if (node.style.lineHeightPx) {
        styles.push(`line-height: ${node.style.lineHeightPx}px`);
      }

      if (node.style.textAlignHorizontal) {
        const align = node.style.textAlignHorizontal.toLowerCase();

        if (align === 'center' || align === 'left' || align === 'right') {
          styles.push(`text-align: ${align}`);
        }
      }
    }

    return styles.join('; ');
  }

  /**
   * Generate HTML for a node
   */
  private _generateHTML(node: FigmaNode, depth = 0): string {
    const className = `figma-${node.type.toLowerCase()}-${node.id.replace(/[^a-zA-Z0-9]/g, '')}`;
    const styles = this._generateCSS(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    if (node.type === 'TEXT' && node.characters) {
      return `<span class="${className}"${styleAttr}>${node.characters}</span>`;
    }

    let html = '';
    const tag = node.layoutMode ? 'div' : 'div';

    html += `<${tag} class="${className}"${styleAttr}>`;

    if (node.children) {
      for (const child of node.children) {
        html += this._generateHTML(child, depth + 1);
      }
    }

    html += `</${tag}>`;

    return html;
  }

  /**
   * Convert Figma file to chat messages
   */
  async convertToMessages(fileId: string, fileName?: string): Promise<Message[]> {
    try {
      const figmaFile = await this.fetchFile(fileId);
      const displayName = fileName || figmaFile.name || 'Figma Design';

      const messages: Message[] = [];

      // Add description message
      messages.push({
        role: 'user',
        content: `Import Figma design: ${displayName}`,
        id: `figma-import-${Date.now()}`,
      });

      // Process top-level frames/pages
      if (figmaFile.document.children) {
        let pageCount = 0;

        for (const page of figmaFile.document.children) {
          if (page.type === 'CANVAS' && page.children) {
            pageCount++;

            for (const frame of page.children) {
              if (frame.type === 'FRAME' || frame.type === 'COMPONENT') {
                const html = this._generateHTML(frame);
                const componentName = frame.name.replace(/[^a-zA-Z0-9]/g, '') || `Component${pageCount}`;

                // Create component file
                messages.push({
                  role: 'assistant',
                  content: `I'll create a React component for "${frame.name}" from your Figma design.`,
                  id: `figma-component-${frame.id}`,
                  toolInvocations: [
                    {
                      toolCallId: `create-${componentName}`,
                      toolName: 'createFile',
                      args: {
                        path: `src/components/${componentName}.tsx`,
                        content: `import React from 'react';
import './${componentName}.css';

interface ${componentName}Props {
  className?: string;
}

export const ${componentName}: React.FC<${componentName}Props> = ({ className }) => {
  return (
    <div className={\`${componentName.toLowerCase()} \${className || ''}\`}>
${html
  .split('\n')
  .map((line) => '      ' + line)
  .join('\n')}
    </div>
  );
};

export default ${componentName};`,
                      },
                      state: 'complete',
                      result: `Created ${componentName}.tsx component`,
                    },
                    {
                      toolCallId: `create-${componentName}-css`,
                      toolName: 'createFile',
                      args: {
                        path: `src/components/${componentName}.css`,
                        content: `/* Styles for ${componentName} component */
.${componentName.toLowerCase()} {
  /* Container styles */
}

/* Figma-generated styles */
${this._generateCSSClasses(frame)}`,
                      },
                      state: 'complete',
                      result: `Created ${componentName}.css styles`,
                    },
                  ],
                });
              }
            }
          }
        }
      }

      // Add usage example
      messages.push({
        role: 'assistant',
        content: `I've successfully imported your Figma design "${displayName}" and created React components. You can now use these components in your application. The components include the layout structure and styling based on your Figma design.`,
        id: `figma-complete-${Date.now()}`,
      });

      return messages;
    } catch (error) {
      throw new Error(`Failed to convert Figma design: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate CSS classes for all nodes in a frame
   */
  private _generateCSSClasses(node: FigmaNode): string {
    let css = '';

    const className = `.figma-${node.type.toLowerCase()}-${node.id.replace(/[^a-zA-Z0-9]/g, '')}`;
    const styles = this._generateCSS(node);

    if (styles) {
      css += `${className} {\n  ${styles.replace(/; /g, ';\n  ')};\n}\n\n`;
    }

    if (node.children) {
      for (const child of node.children) {
        css += this._generateCSSClasses(child);
      }
    }

    return css;
  }
}
