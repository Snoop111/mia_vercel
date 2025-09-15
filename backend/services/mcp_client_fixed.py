"""
MCP Client Fixed - Uses exact format from working Postman requests
Direct tools/call without session initialization
"""

import aiohttp
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class MCPClientFixed:
    """
    Fixed MCP Client that matches Postman's working format exactly
    No session initialization - direct tools/call requests
    """
    
    def __init__(self, base_url: str = "https://marketing-analytics-mcp-5qj9f.ondigitalocean.app"):
        self.base_url = base_url
        self.session = None
        self._request_id = 0
        self._session_id = None
        self._authenticated_user_id = None
        self._initialized = False
        
    def _next_id(self) -> int:
        """Generate next request ID for JSON-RPC"""
        self._request_id += 1
        return self._request_id
    
    async def _ensure_session(self):
        """Ensure aiohttp session exists with proper cookie handling"""
        if self.session is None:
            # Create session with cookie handling - use unsafe=True to allow sharing cookies across domains
            cookie_jar = aiohttp.CookieJar(unsafe=True)
            connector = aiohttp.TCPConnector(
                keepalive_timeout=600, 
                enable_cleanup_closed=True,
                limit=100,
                limit_per_host=30
            )
            timeout = aiohttp.ClientTimeout(total=300, connect=60, sock_read=300)
            
            # Create session that can handle cross-domain cookies like a browser
            self.session = aiohttp.ClientSession(
                connector=connector,
                timeout=timeout, 
                cookie_jar=cookie_jar,
                trust_env=True,
                headers={
                    'User-Agent': 'Mozilla/5.0 (compatible; MCP-Client/1.0)',
                }
            )
    
    async def _authenticate_google_oauth(self, headers: Dict[str, str]):
        """Authenticate this MCP session with Google OAuth by copying browser session cookies"""
        try:
            # Step 1: Get user authentication from local server that has the browser session
            authenticated_user = None
            local_cookies = None
            
            # Try to find the running server on different ports
            for port in ['8007', '8006', '8005', '8004', '8003', '8002', '8001']:
                try:
                    local_oauth_url = f"http://localhost:{port}/api/oauth/google/status"
                    async with self.session.get(local_oauth_url, timeout=2) as local_response:
                        if local_response.status == 200:
                            local_data = await local_response.json()
                            if local_data.get('authenticated'):
                                authenticated_user = local_data['user_info']
                                # Store cookies from the successful local response
                                local_cookies = local_response.cookies
                                print(f"[DEBUG] Found authenticated user on port {port}: {authenticated_user['id']}")
                                break
                        else:
                            continue
                except Exception:
                    continue
            
            if not authenticated_user:
                print("[DEBUG] No authenticated user found on any port")
                return False
            
            # Step 2: Use the authenticated user ID to sync with MCP server
            user_id = authenticated_user['id']
            oauth_sync_url = f"{self.base_url}/google-oauth/user-info"
            
            # Create headers that mimic browser requests
            sync_headers = {
                **headers,
                'User-Agent': 'Mozilla/5.0 (compatible; MCP-Client/1.0)',
                'Origin': f"http://localhost:8001",  # Simulate browser origin
                'Referer': f"http://localhost:8001/",
            }
            
            # Try to authenticate with the MCP server using the user_id
            params = {'user_id': user_id}
            async with self.session.get(
                oauth_sync_url, 
                headers=sync_headers, 
                params=params,
                timeout=30
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('authenticated'):
                        print("[DEBUG] MCP session successfully authenticated with Google OAuth")
                        # Store the user ID for future requests
                        self._authenticated_user_id = user_id
                        return True
                    else:
                        print(f"[DEBUG] MCP server auth failed: user not authenticated")
                        return False
                else:
                    error_text = await response.text()
                    print(f"[DEBUG] MCP OAuth sync failed: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            print(f"[DEBUG] Error authenticating Google OAuth: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    async def _get_authenticated_user_id(self) -> Optional[str]:
        """Get authenticated user ID from OAuth system"""
        if self._authenticated_user_id:
            return self._authenticated_user_id
            
        await self._ensure_session()
        
        try:
            oauth_url = f"{self.base_url}/google-oauth/user-info"
            async with self.session.get(oauth_url, timeout=30) as response:
                if response.status == 200:
                    data = await response.json()
                    is_authenticated = data.get('authenticated', False)
                    user_info = data.get('user_info', {})
                    
                    if is_authenticated and user_info:
                        # Try to get the user ID first, fallback to 'id' or 'sub' if needed
                        user_id = user_info.get('user_id') or user_info.get('id') or user_info.get('sub')
                        if user_id:
                            self._authenticated_user_id = str(user_id)
                            print(f"[DEBUG] Using authenticated user ID: {self._authenticated_user_id}")
                            return self._authenticated_user_id
                        else:
                            print(f"[DEBUG] No user_id found. Available keys: {list(user_info.keys())}")
                
                print(f"[DEBUG] No authenticated user found")
                return None
                
        except Exception as e:
            print(f"[DEBUG] Error getting authenticated user ID: {e}")
            return None
    
    async def _initialize_mcp_session(self):
        """Initialize MCP session with proper protocol sequence"""
        if self._initialized:
            return
            
        await self._ensure_session()
        
        url = f"{self.base_url}/llm/mcp"
        
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
        }
        
        # Step 1: Get session ID with initial request
        init_request = {
            "method": "initialize",
            "params": {},
            "jsonrpc": "2.0",
            "id": self._next_id()
        }
        
        async with self.session.post(url, json=init_request, headers=headers) as response:
            session_id = response.headers.get('mcp-session-id')
            if session_id:
                self._session_id = session_id
                headers['mcp-session-id'] = session_id
                print(f"[DEBUG] Got MCP session ID: {session_id}")
        
        # Step 2: Proper MCP initialize with user authentication
        initialize_request = {
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "clientInfo": {
                    "name": "mia-client", 
                    "version": "1.0.0"
                }
            },
            "jsonrpc": "2.0",
            "id": self._next_id()
        }
        
        async with self.session.post(url, json=initialize_request, headers=headers) as response:
            if response.status == 200:
                text = await response.text()
                for line in text.split('\n'):
                    if line.startswith('data: '):
                        data = line[6:]
                        if data and data != '[DONE]':
                            try:
                                parsed = json.loads(data)
                                if 'result' in parsed:
                                    server_info = parsed['result'].get('serverInfo', {})
                                    print(f"[DEBUG] MCP initialized: {server_info.get('name', 'Unknown')}")
                                    break
                            except json.JSONDecodeError:
                                pass
        
        # Step 3: Authenticate with Google OAuth for this session  
        # This ensures our MCP session inherits the browser's auth state
        await self._authenticate_google_oauth(headers)
        
        # Step 4: Send initialized notification
        initialized_notification = {
            "method": "notifications/initialized",
            "params": {},
            "jsonrpc": "2.0"
        }
        
        async with self.session.post(url, json=initialized_notification, headers=headers) as response:
            if response.status in [200, 202]:  # 202 is also success for notifications
                self._initialized = True
                print(f"[DEBUG] MCP session fully initialized")
            else:
                print(f"[DEBUG] Notification failed: {response.status}")
    
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Call an MCP tool using proper MCP protocol initialization
        """
        # Ensure MCP session is properly initialized
        await self._initialize_mcp_session()
        
        if not self._initialized:
            print("[ERROR] MCP session not initialized")
            return None
        
        url = f"{self.base_url}/llm/mcp"
        
        # Exact format from Postman screenshots
        request = {
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            },
            "jsonrpc": "2.0",
            "id": self._next_id()
        }
        
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
        }
        
        # Only add session ID if it exists (not None)
        if self._session_id is not None:
            headers['mcp-session-id'] = self._session_id
        
        try:
            print(f"[DEBUG] Calling MCP tool: {tool_name}")
            print(f"[DEBUG] Request: {json.dumps(request, indent=2)}")
            print(f"[DEBUG] URL: {url}")
            print(f"[DEBUG] Headers: {headers}")
            
            # Direct request with initialized session - increased timeout for large responses
            async with self.session.post(url, json=request, headers=headers, timeout=300) as response:
                print(f"[DEBUG] Response status: {response.status}")
                
                if response.status == 200:
                    return await self._parse_sse_response(response)
                else:
                    error_text = await response.text()
                    print(f"[DEBUG] Error response: {error_text}")
                    logger.error(f"MCP tool call failed: {response.status} - {error_text}")
                    return None
                
        except Exception as e:
            logger.error(f"MCP tool call error: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def _parse_sse_response(self, response) -> Optional[Dict[str, Any]]:
        """Parse Server-Sent Events response from MCP server"""
        try:
            print("[DEBUG] Reading SSE stream...")
            # Read response text with timeout handling for large responses
            response_text = await response.text()
            print(f"[DEBUG] Raw SSE response length: {len(response_text)} characters")
            if len(response_text) > 5000:
                print(f"[DEBUG] Large response detected, truncating debug output...")
                print(f"[DEBUG] First 500 chars: {response_text[:500]}...")
                print(f"[DEBUG] Last 500 chars: ...{response_text[-500:]}")
            else:
                print(f"[DEBUG] Raw SSE response: {response_text}")
            
            # Parse SSE format
            lines = response_text.strip().split('\n')
            sse_data = None
            
            for line in lines:
                line = line.strip()
                if line.startswith('data: '):
                    json_data = line[6:]  # Remove "data: " prefix
                    if json_data and json_data != '[DONE]':
                        try:
                            sse_data = json.loads(json_data)
                            print(f"[DEBUG] Parsed SSE data: {json.dumps(sse_data, indent=2)}")
                            break
                        except json.JSONDecodeError:
                            print(f"[DEBUG] Could not parse SSE JSON: {json_data}")
            
            if not sse_data:
                print("[DEBUG] No valid SSE data found")
                return None
            
            # Handle JSON-RPC error responses
            if 'error' in sse_data:
                error = sse_data['error']
                print(f"[DEBUG] MCP tool returned error: {error}")
                return {'error': error['message'], 'success': False}
            
            # Handle successful responses with result
            if 'result' in sse_data:
                result = sse_data['result']
                print(f"[DEBUG] MCP tool result: {json.dumps(result, indent=2)}")
                
                # Handle the response format we see in Postman screenshots
                if 'content' in result:
                    content = result['content']
                    if isinstance(content, list) and len(content) > 0:
                        # Extract text content and try to parse as JSON
                        text_content = content[0].get('text', '')
                        if text_content:
                            try:
                                parsed_content = json.loads(text_content)
                                print(f"[DEBUG] Parsed content from text: {type(parsed_content)}")
                                return parsed_content
                            except json.JSONDecodeError:
                                print("[DEBUG] Content text is not JSON, returning as text")
                                return {'text': text_content}
                        else:
                            print("[DEBUG] No text content found in content array")
                            return content[0]
                
                # Handle structured content (second response format from screenshot)
                if 'structuredContent' in result:
                    print("[DEBUG] Found structuredContent")
                    return result['structuredContent']
                
                # Return result directly if no special handling needed
                return result
                
            # Return raw data if no standard format
            return sse_data
                
        except Exception as e:
            logger.error(f"Error parsing SSE response: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def get_comprehensive_insights(
        self,
        user_id: Optional[str] = None,
        data_selections: List[Dict[str, Any]] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        min_spend_threshold: float = 100,
        budget_increase_limit: float = 50
    ) -> Optional[Dict[str, Any]]:
        """Call get_comprehensive_insights with proper format"""
        if data_selections is None:
            data_selections = []
        
        # Use authenticated user ID if not provided
        if not user_id:
            user_id = await self._get_authenticated_user_id()
            if not user_id:
                print("[ERROR] No authenticated user ID available for comprehensive insights")
                return {"error": "No authenticated user", "success": False}
                
        arguments = {
            "user_id": user_id,
            "data_selections": data_selections,
            "start_date": start_date,
            "end_date": end_date,
            "min_spend_threshold": min_spend_threshold,
            "budget_increase_limit": budget_increase_limit
        }
        
        return await self.call_tool("get_comprehensive_insights", arguments)
    
    async def query_google_ads_data(
        self,
        user_id: Optional[str] = None,
        customer_id: Optional[str] = None,
        query_type: str = "campaigns",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        dimensions: Optional[List[str]] = None,
        metrics: Optional[List[str]] = None,
        custom_query: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Call query_google_ads_data with proper format"""
        # Use authenticated user ID if not provided
        if not user_id:
            user_id = await self._get_authenticated_user_id()
            if not user_id:
                print("[ERROR] No authenticated user ID available for Google Ads query")
                return {"error": "No authenticated user", "success": False}
        
        arguments = {
            "user_id": user_id,
            "customer_id": customer_id,
            "query_type": query_type,
            "start_date": start_date,
            "end_date": end_date,
            "dimensions": dimensions,
            "metrics": metrics,
            "custom_query": custom_query
        }
        
        # Remove None values to match Postman format
        arguments = {k: v for k, v in arguments.items() if v is not None}
        
        return await self.call_tool("query_google_ads_data", arguments)
    
    async def query_ga4_data(
        self,
        user_id: Optional[str] = None,
        property_id: Optional[str] = None,
        query_type: str = "overview",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        dimensions: Optional[List[str]] = None,
        metrics: Optional[List[str]] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Call query_ga4_data with proper format"""
        # Use authenticated user ID if not provided
        if not user_id:
            user_id = await self._get_authenticated_user_id()
            if not user_id:
                print("[ERROR] No authenticated user ID available for GA4 query")
                return {"error": "No authenticated user", "success": False}
        
        arguments = {
            "user_id": user_id,
            "property_id": property_id,
            "query_type": query_type,
            "start_date": start_date,
            "end_date": end_date,
            "dimensions": dimensions,
            "metrics": metrics,
            "filters": filters
        }
        
        # Remove None values
        arguments = {k: v for k, v in arguments.items() if v is not None}
        
        return await self.call_tool("query_ga4_data", arguments)
    
    async def get_platform_examples(self) -> Optional[Dict[str, Any]]:
        """Call get_platform_examples with proper format"""
        return await self.call_tool("get_platform_examples", {})
    
    async def get_google_ads_accounts(self, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Call get_google_ads_accounts with authenticated user_id"""
        # Get authenticated user ID from OAuth system  
        if not user_id:
            user_id = await self._get_authenticated_user_id()
            if not user_id:
                print("[ERROR] No authenticated user ID available for Google Ads accounts")
                return {"error": "No authenticated user", "success": False}
        
        return await self.call_tool("get_google_ads_accounts", {"user_id": user_id})
    
    async def get_ga4_properties(self, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Call get_ga4_properties with authenticated user_id"""
        # Get authenticated user ID from OAuth system
        if not user_id:
            user_id = await self._get_authenticated_user_id()
            if not user_id:
                print("[ERROR] No authenticated user ID available for GA4 properties")
                return {"error": "No authenticated user", "success": False}
        
        return await self.call_tool("get_ga4_properties", {"user_id": user_id})
        
    async def query_google_ads_data(self, user_id: str, customer_id: Optional[str] = None, 
                                  query_type: str = "campaigns", start_date: Optional[str] = None, 
                                  end_date: Optional[str] = None, dimensions: Optional[List[str]] = None,
                                  metrics: Optional[List[str]] = None, custom_query: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Query Google Ads data directly with specific parameters"""
        arguments = {
            "user_id": user_id,
            "query_type": query_type
        }
        
        # Add optional parameters
        if customer_id:
            arguments["customer_id"] = customer_id
        if start_date:
            arguments["start_date"] = start_date
        if end_date:
            arguments["end_date"] = end_date
        if dimensions:
            arguments["dimensions"] = dimensions
        if metrics:
            arguments["metrics"] = metrics
        if custom_query:
            arguments["custom_query"] = custom_query
        
        return await self.call_tool("query_google_ads_data", arguments)
        
    async def query_ga4_data(self, user_id: str, property_id: Optional[str] = None, 
                           query_type: str = "overview", start_date: Optional[str] = None, 
                           end_date: Optional[str] = None, dimensions: Optional[List[str]] = None,
                           metrics: Optional[List[str]] = None, filters: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """Query GA4 data directly with specific parameters"""
        arguments = {
            "user_id": user_id,
            "query_type": query_type
        }
        
        # Add optional parameters
        if property_id:
            arguments["property_id"] = property_id
        if start_date:
            arguments["start_date"] = start_date
        if end_date:
            arguments["end_date"] = end_date
        if dimensions:
            arguments["dimensions"] = dimensions
        if metrics:
            arguments["metrics"] = metrics
        if filters:
            arguments["filters"] = filters
        
        return await self.call_tool("query_ga4_data", arguments)
    
    async def get_meta_ads_accounts(self, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Call get_meta_ads_accounts with proper format"""
        # Use authenticated user ID if not provided
        if not user_id:
            user_id = await self._get_authenticated_user_id()
            if not user_id:
                print("[ERROR] No authenticated user ID available for Meta Ads accounts")
                return {"error": "No authenticated user", "success": False}
        
        return await self.call_tool("get_meta_ads_accounts", {"user_id": user_id})
    
    async def close(self):
        """Close the session"""
        if self.session:
            await self.session.close()
            self.session = None


# Singleton instance
_mcp_client_fixed = None


async def get_mcp_client_fixed() -> MCPClientFixed:
    """Get or create the fixed MCP client singleton"""
    global _mcp_client_fixed
    if _mcp_client_fixed is None:
        _mcp_client_fixed = MCPClientFixed()
    return _mcp_client_fixed