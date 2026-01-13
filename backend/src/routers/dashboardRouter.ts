import z from "zod";
import { protectedProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { DeadPerson, Grave, Organisation } from "../db/entities.ts";

export const dashboardRouter = router({
    // OGD: Organisations, Graves, DeadPerson
    getOGDAdminStates: protectedProcedure
        .input(
          z.object({
            currentUserOrganisation: z.number().optional().nullable(),
            isSuperAdmin: z.boolean().optional().default(false)
          })
        )
        .query(async ({ input }) => {
          const { isSuperAdmin, currentUserOrganisation } = input;
    
          const organisationRepo = AppDataSource.getRepository(Organisation);
          const graveRepo = AppDataSource.getRepository(Grave);
          const deadPersonRepo = AppDataSource.getRepository(DeadPerson);
    
          if (isSuperAdmin) {
            return {
              organisationCount: await organisationRepo.count() ?? 0,
              graveCount: await graveRepo.count() ?? 0,
              deadPersonCount: await deadPersonRepo.count() ?? 0,
            }
          }
    
          if (!currentUserOrganisation) {
            return { organisationCount: 0, graveCount: 0, deadPersonCount: 0 };
          }
              
          const organisationsId = await organisationRepo
            .createQueryBuilder('organisation')
            .select('organisation.id', 'id')
            .where('organisation.id = :id OR organisation.parentorganisation = :id', { id: currentUserOrganisation })
            .getRawMany();
    
          const organisationsIdArr = organisationsId.map(r => r.id);
    
          const gravesIds = await graveRepo
            .createQueryBuilder('graves')
            .select('graves.id', 'id')
            .where('graves.organisation IN (:...ids)', { ids: organisationsIdArr })
            .getRawMany();
    
          const gravesIdArr = gravesIds.map(r => r.id);
    
          const deadPersonIds = await deadPersonRepo
            .createQueryBuilder('deadperson')
            .select('deadperson.id', 'id')
            .where('deadperson.grave IN (:...ids)', { ids: gravesIdArr })
            .getRawMany();
    
          const deadPersonIdArr = deadPersonIds.map(r => r.id);
    
          return {
            organisationCount: organisationsIdArr.length ?? 0,
            graveCount: gravesIdArr.length ?? 0,
            deadPersonCount: deadPersonIdArr.length ?? 0,
          };
        }),
});