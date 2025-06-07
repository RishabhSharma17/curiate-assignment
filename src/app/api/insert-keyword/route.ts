

export async function POST(req: Request) {
    try {
        const {match, replacement,content} = await req.json();

        const start = match.offset;
        const end = match.offset + match.length;
      
        const newContent = 
        content.substring(0, start) + 
        replacement + 
        content.substring(end);
        
        return Response.json({
            newContent,
            success:true
        },{status:200});

    } catch (error) {
        console.log(error);
        return Response.json({
            error,
            success:true
        },{status:500});
    }
}
