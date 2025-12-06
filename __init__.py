import os
import server
from aiohttp import web

# Debug mode - set to False in production
DEBUG = False

def debug_print(message):
    """Print debug messages only if DEBUG is enabled"""
    if DEBUG:
        print(message)

# The directory where the custom node is located
NODE_DIR = os.path.dirname(os.path.abspath(__file__))
# WEB_DIRECTORY tells ComfyUI where to find static files
WEB_DIRECTORY = os.path.join(NODE_DIR, "duck_shooter")

# --- ComfyUI Custom Node ---
class DuckShooter_Input:
    """Duck Shooter Game node - launches the game overlay in ComfyUI"""

    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {"required": {}}

    RETURN_TYPES = ()
    FUNCTION = "run"
    OUTPUT_NODE = True
    CATEGORY = "Game"

    def run(self):
        # This node just needs to exist to load the game extension
        return ()

# --- API Routes ---

# Serve static files
@server.PromptServer.instance.routes.get("/duck_shooter/html/index.html")
async def serve_index(request):
    file_path = os.path.join(NODE_DIR, "duck_shooter", "html", "index.html")
    debug_print(f"Duck Shooter: [HTML] Request: index.html, Path: {file_path}")
    if not os.path.exists(file_path):
        debug_print(f"Duck Shooter: [HTML] ERROR - File not found: {file_path}")
        return web.Response(status=404, text=f"HTML file not found: {file_path}")
    return web.FileResponse(file_path)

# Unified CSS route handler (handles both /css/ and /CSS/)
@server.PromptServer.instance.routes.get("/duck_shooter/{path:css|CSS}/{file}")
async def serve_css(request):
    file = request.match_info["file"]
    file_path = os.path.join(NODE_DIR, "duck_shooter", "CSS", file)
    debug_print(f"Duck Shooter: [CSS] Request: {file}, Path: {file_path}")
    if not os.path.exists(file_path):
        debug_print(f"Duck Shooter: [CSS] ERROR - File not found: {file_path}")
        return web.Response(status=404, text=f"CSS file not found: {file_path}")
    return web.FileResponse(file_path)

# Unified JS route handler (handles both /js/ and /JS/)
@server.PromptServer.instance.routes.get("/duck_shooter/{path:js|JS}/{file}")
async def serve_js(request):
    file = request.match_info["file"]
    file_path = os.path.join(NODE_DIR, "duck_shooter", "js", file)
    debug_print(f"Duck Shooter: [JS] Request: {file}, Path: {file_path}")
    if not os.path.exists(file_path):
        debug_print(f"Duck Shooter: [JS] ERROR - File not found: {file_path}")
        return web.Response(status=404, text=f"File not found: {file_path}")
    return web.FileResponse(file_path)

@server.PromptServer.instance.routes.get("/duck_shooter/resources/{path:.*}")
async def serve_resources(request):
    path = request.match_info["path"]
    # Prevent path traversal attacks
    if ".." in path or path.startswith("/"):
        return web.Response(status=403, text="Forbidden: Invalid path")
    
    file_path = os.path.join(NODE_DIR, "duck_shooter", "resources", path)
    # Normalize path to prevent directory traversal
    file_path = os.path.normpath(file_path)
    resources_dir = os.path.normpath(os.path.join(NODE_DIR, "duck_shooter", "resources"))
    
    # Ensure the resolved path is within resources directory
    if not file_path.startswith(resources_dir):
        return web.Response(status=403, text="Forbidden: Path traversal detected")
    
    debug_print(f"Duck Shooter: [RESOURCE] Request: {path}, Path: {file_path}")
    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        debug_print(f"Duck Shooter: [RESOURCE] ERROR - File not found: {file_path}")
        # List directory to help debug
        if DEBUG:
            dir_path = os.path.dirname(file_path)
            if os.path.exists(dir_path):
                try:
                    files = os.listdir(dir_path)
                    debug_print(f"Duck Shooter: [RESOURCE] Directory exists, files: {files[:10]}")
                except:
                    pass
        return web.Response(status=404, text=f"Resource not found: {file_path}")
    debug_print(f"Duck Shooter: [RESOURCE] SUCCESS - Serving: {file_path}")
    return web.FileResponse(file_path)

# --- Node Mappings ---
NODE_CLASS_MAPPINGS = {
    "DuckShooter_Input": DuckShooter_Input
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DuckShooter_Input": "Duck Shooter Game"
}

# Success message
print("\033[34mDuck Shooter Game Custom Node: \033[92mLoaded\033[0m")