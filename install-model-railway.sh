#!/bin/bash

# Script to install a model in Railway Ollama
# This should be run in Railway shell

echo "Installing tinyllama model in Railway Ollama..."

# Pull a small model
ollama pull tinyllama

# Verify the model was installed
echo "Available models:"
ollama list

echo "Model installation complete!"
