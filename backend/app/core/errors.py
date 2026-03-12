from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR
import traceback
import logging

# Setup Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AI_Guruji_Backend")

class BaseServiceError(Exception):
    """Base class for service-related errors."""
    def __init__(self, message: str, service_name: str):
        self.message = message
        self.service_name = service_name
        super().__init__(message)

class LLMGenerationError(BaseServiceError):
    pass

class RAGError(BaseServiceError):
    pass

class AssetGenerationError(BaseServiceError):
    pass

async def global_exception_handler(request: Request, exc: Exception):
    """
    Catches all unhandled exceptions to prevent server crash.
    Returns a unified JSON error response.
    """
    
    # Log the full stack trace for developers
    error_details = traceback.format_exc()
    # Print to console so user can see it in terminal
    print(f"❌ UNHANDLED EXCEPTION: {exc}")
    print(error_details)
    
    logger.error(f"CRITICAL ERROR at {request.url.path}: {exc}\n{error_details}")

    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "message": exc.detail,
                "path": request.url.path
            }
        )

    if isinstance(exc, BaseServiceError):
         return JSONResponse(
            status_code=503, # Service Unavailable
            content={
                "status": "error",
                "service": exc.service_name,
                "message": f"Service Failure: {exc.message}",
                "suggestion": "Please check backend logs or try again later."
            }
        )

    # Generic Fallback
    return JSONResponse(
        status_code=HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "critical_failure",
            "message": "An unexpected internal error occurred.",
            "error_type": type(exc).__name__,
            "details": str(exc) # Helpful for debugging, maybe hide in strict prod
        }
    )
