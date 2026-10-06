import type { PrismaClient } from "@prisma/client";
export async function chooseCompanyCover(db: Pick<PrismaClient,"$transaction">, companyId:number, id:number) {
  return db.$transaction(async tx => {
    const photo=await tx.companyPhoto.findFirst({where:{id,companyId,active:true}});
    if (!photo) return false;
    const first=await tx.companyPhoto.findFirst({where:{companyId,active:true},orderBy:{sortOrder:"asc"}});
    if(first?.id !== id || photo.sortOrder >= 0) await tx.companyPhoto.update({where:{id},data:{sortOrder:(first?.sortOrder ?? 0)-1}});
    return true;
  });
}
