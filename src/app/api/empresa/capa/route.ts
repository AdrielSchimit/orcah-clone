import { NextResponse } from "next/server";
import { requireActivePlan } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { uploadCompanyImage, UploadError } from "@/lib/storage";
import { coverHistoryPaths, rememberCover } from "@/lib/cover-history";
import { normalizeHexColor } from "@/lib/public-page";
export async function PATCH(request:Request) {
 const auth=await requireActivePlan(); if("error" in auth) return auth.error;
 const body=await request.json().catch(()=>null);
 const company=await prisma.company.findUniqueOrThrow({where:{id:auth.company.id}});
 if(body?.useDefault === true) {
  await prisma.company.update({where:{id:company.id},data:{coverPath:null,coverHistory:rememberCover(company.coverHistory,company.coverPath)}});
  return NextResponse.json({ok:true});
 }
 if(typeof body?.historyPath === "string") {
  const history=rememberCover(company.coverHistory,company.coverPath);
  if(!coverHistoryPaths(history).includes(body.historyPath)) return NextResponse.json({error:"Capa não encontrada."},{status:404});
  await prisma.company.update({where:{id:company.id},data:{coverPath:body.historyPath,coverHistory:rememberCover(history,company.coverPath,body.historyPath)}});
  return NextResponse.json({ok:true});
 }
 const color=normalizeHexColor(body?.color);if(!color) return NextResponse.json({error:"Cor inválida."},{status:400});
 await prisma.company.update({where:{id:auth.company.id},data:{primaryColor:color,coverPath:null,coverHistory:rememberCover(company.coverHistory,company.coverPath)}});
 return NextResponse.json({ok:true});
}

export async function POST(request:Request) {
 const auth=await requireActivePlan();if("error" in auth) return auth.error;
 const form=await request.formData();const file=form.get("file");
 if(!(file instanceof File)||file.size===0) return NextResponse.json({error:"Escolha uma foto."},{status:400});
 try {
  const coverPath=await uploadCompanyImage({companyId:auth.company.id,kind:"cover",file});
  const company=await prisma.company.findUniqueOrThrow({where:{id:auth.company.id}});
  await prisma.company.update({where:{id:auth.company.id},data:{coverPath,coverHistory:rememberCover(company.coverHistory,company.coverPath,coverPath)}});
  return NextResponse.json({ok:true,coverPath});
 } catch(error) {return NextResponse.json({error:error instanceof UploadError ? error.message : "Não foi possível salvar a capa."},{status:error instanceof UploadError ? 400 : 500});}
}
