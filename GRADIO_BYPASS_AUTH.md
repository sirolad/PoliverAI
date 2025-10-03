# Gradio Bypass Authentication

This document explains how to enable full access to all PoliverAI features in the Gradio interface for development and demo purposes.

## Overview

By default, the Gradio interface enforces the same authentication and subscription restrictions as the React frontend:
- **Fast mode**: Available to all users (no authentication required)
- **Balanced mode**: Requires Pro subscription and authentication
- **Detailed mode**: Requires Pro subscription and authentication

The bypass feature allows you to disable these restrictions in the Gradio interface while keeping the React frontend's authentication system intact.

## Enabling Bypass Mode

### Method 1: Environment Variable

Set the `GRADIO_BYPASS_AUTH` environment variable to `true`:

```bash
export GRADIO_BYPASS_AUTH=true
python -m uvicorn src.poliverai.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Method 2: Using the Convenience Script

Use the provided script that sets the environment variable automatically:

```bash
./run_gradio_dev.sh
```

## What Changes When Bypass is Enabled

### Gradio Interface Changes:
1. **Analysis Mode Options**: All modes (Fast, Balanced, Detailed) are available without restrictions
2. **Default Mode**: Changes from "Fast" to "Balanced" (recommended mode)
3. **UI Labels**: Removes "(Pro required)" labels from advanced modes
4. **Header Message**: Shows "Developer Mode Enabled" banner
5. **Analysis Guide**: Updated to reflect full access availability

### API Behavior:
- The `/verify` endpoint allows unauthenticated requests to use "balanced" and "detailed" modes
- React frontend authentication remains completely unchanged
- All other API endpoints maintain their original authentication requirements

## Use Cases

- **Development**: Test all analysis modes during development without authentication setup
- **Demos**: Showcase full functionality without requiring user registration
- **Testing**: Verify behavior of advanced analysis modes in isolation
- **Research**: Access detailed analysis features for policy research

## Security Considerations

⚠️ **Important**: This feature is intended for development and demonstration purposes only.

- **Production**: Do not enable this in production environments
- **Scope**: Only affects the Gradio interface - React frontend authentication is unchanged
- **API Access**: Advanced modes become available to unauthenticated API calls when enabled

## Example Usage

```bash
# Terminal 1: Start server with bypass enabled
export GRADIO_BYPASS_AUTH=true
python -m uvicorn src.poliverai.app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Test API with advanced mode (no auth required)
curl -X POST "http://localhost:8000/api/v1/verify" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample-policy.txt" \
  -F "analysis_mode=balanced"
```

## Disabling Bypass Mode

To return to normal authentication behavior:

```bash
unset GRADIO_BYPASS_AUTH
# or
export GRADIO_BYPASS_AUTH=false
```

Then restart the server. The Gradio interface will return to restricted mode with only Fast analysis available without authentication.
