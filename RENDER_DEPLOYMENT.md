# Render Deployment Guide for GEN-AI Resume Analyzer

## Prerequisites
- Both Frontend and Backend folders uploaded to Render
- GitHub repository with the code pushed

## Step 1: Deploy Backend Service

1. Go to [render.com](https://render.com) and create a new Web Service
2. Connect your GitHub repository
3. Fill in these details:
   - **Name**: genai-backend
   - **Environment**: Node
   - **Region**: Choose closest to you (e.g., Oregon)
   - **Branch**: master
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Starter (or higher)

4. Add Environment Variables:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GOOGLE_GENAI_API_KEY=your_google_genai_api_key
   FRONTEND_URL=https://your-frontend-domain.onrender.com
   NODE_ENV=production
   ```

5. Click "Create Web Service" and wait for deployment

6. Once deployed, note your backend URL (e.g., `https://genai-backend.onrender.com`)

## Step 2: Deploy Frontend Service

1. Create a new Static Site service on Render
2. Connect your GitHub repository
3. Fill in these details:
   - **Name**: genai-frontend
   - **Environment**: Static Site
   - **Region**: Same as backend if possible
   - **Branch**: master
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `Frontend/dist`

4. Add Environment Variables:
   ```
   VITE_API_URL=https://genai-backend.onrender.com
   ```

5. Click "Create Static Site" and wait for deployment

## Step 3: Update Backend Environment Variables

After frontend is deployed, update the backend's `FRONTEND_URL`:
1. Go to Backend service > Environment
2. Update `FRONTEND_URL` to your frontend domain
3. The backend will redeploy automatically

## Step 4: Verify Connection

1. Visit your frontend URL
2. Register a new account
3. Generate an interview report
4. Check browser console for any CORS or API errors

## Troubleshooting

### CORS Errors
If you see CORS errors, update `Backend/src/app.js` with the correct frontend URL in the allowedOrigins array.

### API Calls Failing
1. Check that `VITE_API_URL` matches your backend URL exactly
2. Ensure both services are deployed and running
3. Check the browser Network tab to see actual API requests

### Environment Variables Not Loading
Redeploy the service after updating environment variables in Render dashboard.

## Alternative: Using render.yaml (Recommended)

If you want to deploy both services together:

1. Push the `render.yaml` file to GitHub
2. In Render Dashboard, select "Infrastructure as Code"
3. Connect your GitHub repo
4. Render will automatically create and configure both services

Then just update the environment variables in the YAML file before pushing.
