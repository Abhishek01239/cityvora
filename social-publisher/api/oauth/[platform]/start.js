export default async function handler(req,res){
  const platform=req.query.platform;
  const supported=["instagram","facebook","linkedin","x","youtube","threads","bluesky"];
  if(!supported.includes(platform)) return res.status(404).json({error:"Unsupported platform"});
  const env={
    instagram:process.env.INSTAGRAM_CLIENT_ID,
    facebook:process.env.FACEBOOK_CLIENT_ID,
    linkedin:process.env.LINKEDIN_CLIENT_ID,
    x:process.env.X_CLIENT_ID,
    youtube:process.env.GOOGLE_CLIENT_ID,
    threads:process.env.THREADS_CLIENT_ID,
    bluesky:process.env.BLUESKY_CLIENT_ID
  };
  if(!env[platform]) return res.status(503).json({error:`OAuth app not configured for ${platform}`,next:"Add the provider client ID/secret to Vercel environment variables."});
  return res.status(501).json({error:`OAuth flow for ${platform} is scaffolded but needs its provider-specific redirect URL, scopes and token exchange configured.`});
}
