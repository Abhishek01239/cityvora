export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST required"});
  try{
    const body=typeof req.body==="string"?JSON.parse(req.body):req.body||{};
    if(!body.text?.trim()) return res.status(400).json({error:"text is required"});
    const platforms=Array.isArray(body.platforms)?body.platforms:[];
    if(!platforms.length) return res.status(400).json({error:"at least one platform is required"});
    // Provider adapters are intentionally isolated. Add OAuth/token lookup and
    // official API calls here after each provider app is configured.
    return res.status(200).json({
      ok:true,
      mode:"provider-adapters",
      message:"Publish request accepted. Configure the requested provider OAuth apps before live publishing.",
      requested:{platforms,text:body.text,url:body.url||null}
    });
  }catch(e){return res.status(400).json({error:"Invalid JSON"})}
}
