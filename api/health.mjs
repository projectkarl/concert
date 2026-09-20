export default function handler(req,res){res.status(200).json({ok:true,app:'NEUL',version:'0.56',time:new Date().toISOString()})}
