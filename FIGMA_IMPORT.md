# Figma Import Feature for bolt.diy

This implementation adds Figma design import functionality to bolt.diy, allowing users to import designs from Figma and convert them to React components.

## Features

### 1. Figma URL Parsing
Supports multiple Figma URL formats:
- Standard file URLs: `https://www.figma.com/file/[fileId]/[fileName]`
- Design URLs: `https://www.figma.com/design/[fileId]/[fileName]`
- Prototype URLs: `https://www.figma.com/proto/[fileId]/[fileName]`

### 2. Design-to-Code Conversion
- Converts Figma frames and components to React components
- Generates TypeScript interfaces for props
- Creates separate CSS files with Figma-derived styles
- Handles layout properties (flexbox, padding, gap, etc.)
- Converts colors, typography, and border styles

### 3. UI Integration
- Seamlessly integrated with existing import buttons
- Modal dialog for entering Figma URL and API key
- Consistent styling with bolt.diy design system
- Proper loading states and error handling

### 4. Security & API Handling
- Server-side API processing for security
- Secure API key handling (not stored or cached)
- Proper error messages for authentication issues
- File permission validation

## Usage

1. **Get Figma API Key**:
   - Go to [Figma Settings](https://www.figma.com/developers/api#access-tokens)
   - Generate a personal access token

2. **Import a Design**:
   - Click "Import Figma" button on the main interface
   - Paste your Figma URL (file, design, or prototype)
   - Enter your API key
   - Click "Import"

3. **Generated Output**:
   - React component files (`.tsx`) with TypeScript interfaces
   - CSS files (`.css`) with design styles
   - Proper component structure and styling

## Technical Implementation

### Files Added/Modified:
- `app/lib/services/figmaService.ts` - Core Figma API integration
- `app/components/chat/FigmaImportButton.tsx` - UI component
- `app/routes/api.figma-import.ts` - API route for server-side processing
- `app/components/chat/chatExportAndImport/ImportButtons.tsx` - Updated to include Figma import
- `app/lib/services/figmaService.spec.ts` - Test coverage

### Example Output:
When importing a Figma design, the system generates:

```tsx
// MyComponent.tsx
import React from 'react';
import './MyComponent.css';

interface MyComponentProps {
  className?: string;
}

export const MyComponent: React.FC<MyComponentProps> = ({ className }) => {
  return (
    <div className={`mycomponent ${className || ''}`}>
      {/* Generated component structure */}
    </div>
  );
};

export default MyComponent;
```

```css
/* MyComponent.css */
.mycomponent {
  /* Container styles */
}

/* Figma-generated styles */
.figma-frame-abc123 {
  background-color: rgb(255, 255, 255);
  border-radius: 8px;
  padding: 16px 24px 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

## Future Enhancements

This basic implementation provides a foundation for:
- Advanced component recognition and optimization
- Design system integration
- Asset extraction (images, icons)
- Animation and interaction import
- Figma plugin development

## Requirements

- Figma API access token
- Internet connection for Figma API calls
- Valid Figma file permissions

The implementation follows bolt.diy's existing patterns and provides a seamless user experience for importing Figma designs into the development workflow.