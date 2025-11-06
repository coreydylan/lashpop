# Authentication

## Overview

Vagaro uses token-based authentication for API access. You must generate an access token before making any API calls.

## Generate Access Token

**Endpoint:** `POST /api/auth/token`

### Purpose

Creates authentication credentials required for all subsequent API requests.

### Request

```http
POST /api/auth/token
Content-Type: application/json
```

#### Request Body

```json
{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "grant_type": "client_credentials"
}
```

### Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

## Using the Access Token

Include the access token in the Authorization header for all API requests:

```http
Authorization: Bearer {access_token}
```

### Example Request

```http
GET /api/customers/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

## Security Best Practices

1. **Store Credentials Securely**
   - Never commit client secrets to version control
   - Use environment variables or secure credential management systems
   - Rotate credentials regularly

2. **Token Management**
   - Cache tokens and reuse until expiration
   - Implement token refresh logic before expiration
   - Handle token expiration errors gracefully

3. **API Key Security**
   - Restrict API key permissions to minimum required access
   - Use separate credentials for development and production
   - Monitor API usage for unusual patterns

## Error Responses

### 401 Unauthorized

```json
{
  "error": "invalid_client",
  "error_description": "Client authentication failed"
}
```

**Causes:**
- Invalid client_id or client_secret
- Expired credentials
- Disabled API access

### 400 Bad Request

```json
{
  "error": "invalid_request",
  "error_description": "Missing required parameter: grant_type"
}
```

**Causes:**
- Missing required parameters
- Invalid grant_type value

## Token Lifecycle

1. **Request Token** - Call token endpoint with credentials
2. **Store Token** - Cache the access token securely
3. **Use Token** - Include in Authorization header
4. **Refresh Token** - Generate new token before expiration
5. **Handle Expiration** - Implement automatic retry with new token

## Rate Limiting

Be aware of rate limits when generating tokens:
- Avoid generating a new token for each API request
- Reuse tokens until they expire
- Implement exponential backoff for rate limit errors

## Next Steps

Once authenticated, proceed to:
- [Employee Management](./02-employees.md)
- [Customer Management](./03-customers.md)
- [Appointments](./04-appointments.md)
