#!/bin/bash
<<<<<<< HEAD
# Run PoliverAI server with Gradio bypass authentication enabled
# This allows all analysis modes (fast, balanced, detailed) in the Gradio UI
# without requiring user authentication - useful for development and demos
=======

# Run PoliverAI server with Gradio bypass authentication enabled
# This allows all analysis modes (fast, balanced, detailed) in the Gradio UI
# without requiring user authentication - useful for development and demos

>>>>>>> main
echo "🛠️  Starting PoliverAI server with Gradio Developer Mode enabled..."
echo "📝 All analysis modes will be available in the Gradio interface"
echo "🌐 Gradio UI: http://localhost:8000/"
echo "🔧 React Frontend: http://localhost:8000/dashboard"
echo ""
<<<<<<< HEAD
=======

>>>>>>> main
export GRADIO_BYPASS_AUTH=true
python -m uvicorn src.poliverai.app.main:app --host 0.0.0.0 --port 8000 --reload
