// @ts-nocheck
import { protectedProcedure, router } from "../trpc.js";
import { InventoryItem, InventoryPackage, PackageItem } from "../db/entities.js";
import { AppDataSource } from "../datasource.js";
import { z } from "zod";
import {
  inventoryPackageSchema,
  packageItemSchema,
} from "../schemas/inventoryPackageSchema.js";
import { ActiveInactiveStatus, InventoryItemStatus } from "../db/enums.js";

const ALLOWED_SORT_FIELDS: Record<string, string> = {
  id: "pkg.id",
  package_name: "pkg.package_name",
  gender_type: "pkg.gender_type",
  age_group: "pkg.age_group",
  status: "pkg.status",
  createdat: "pkg.createdat",
};

export const inventoryPackageRouter = router({
  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).default(10),
        filterName: z.string().optional(),
        filterGender: z.string().optional(),
        filterStatus: z.nativeEnum(ActiveInactiveStatus).optional(),
        sortField: z.string().optional(),
        sortOrder: z.enum(["ASC", "DESC"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, pageSize, filterName, filterGender, filterStatus, sortField, sortOrder } =
        input;

      const repo = AppDataSource.getRepository(InventoryPackage);
      const query = repo
        .createQueryBuilder("pkg")
        .leftJoinAndSelect("pkg.packageItems", "packageItems")
        .leftJoinAndSelect("packageItems.item", "item")
        .leftJoinAndSelect("packageItems.group", "group");

      if (filterName) {
        query.andWhere("pkg.package_name ILIKE :name", {
          name: `%${filterName}%`,
        });
      }

      if (filterGender && filterGender !== "all") {
        query.andWhere("pkg.gender_type = :gender_type", {
          gender_type: filterGender,
        });
      }

      if (filterStatus) {
        query.andWhere("pkg.status = :status", { status: filterStatus });
      }

      const orderCol =
        ALLOWED_SORT_FIELDS[sortField ?? "id"] ?? "pkg.id";
      const orderDir = sortOrder ?? "DESC";

      const [items, total] = await query
        .orderBy(orderCol, orderDir)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return { items, total };
    }),

  getAll: protectedProcedure.query(async () => {
    return await AppDataSource.getRepository(InventoryPackage).find({
      relations: ["packageItems", "packageItems.item", "packageItems.group"],
      order: { package_name: "ASC" },
    });
  }),

  checkAvailability: protectedProcedure
    .input(z.number().int().positive())
    .query(async ({ input: packageId }) => {
      const pkg = await AppDataSource.getRepository(InventoryPackage).findOne({
        where: { id: packageId },
        relations: ["packageItems", "packageItems.item", "packageItems.group"],
      });

      if (!pkg) throw new Error("Pakej tidak dijumpai");

      const shortfall: {
        item_name: string;
        required: number;
        available: number;
      }[] = [];

      for (const pi of pkg.packageItems ?? []) {
        if (pi.groupId) {
          const groupItems = await AppDataSource.getRepository(InventoryItem).find({
            where: { groupId: pi.groupId },
          });
          const available = groupItems.some((i) => i.current_quantity >= pi.quantity_required)
            ? pi.quantity_required
            : Math.max(...groupItems.map((i) => i.current_quantity), 0);
          if (available < pi.quantity_required) {
            shortfall.push({
              item_name: pi.group?.name ?? "Unknown",
              required: pi.quantity_required,
              available,
            });
          }
          continue;
        }

        const current = pi.item?.current_quantity ?? 0;
        if (current < pi.quantity_required) {
          shortfall.push({
            item_name: pi.item?.item_name ?? "Unknown",
            required: pi.quantity_required,
            available: current,
          });
        }
      }

      return { canFulfil: shortfall.length === 0, shortfall };
    }),

  create: protectedProcedure
    .input(inventoryPackageSchema)
    .mutation(async ({ input, ctx }) => {
      const { packageItems, ...packageData } = input;

      return await AppDataSource.transaction(async (manager) => {
        const pkg = manager.create(InventoryPackage, {
          ...packageData,
          createdbyId: Number(ctx.user.id),
        });
        const savedPkg = await manager.save(pkg);

        const lineItems = packageItems.map((pi) =>
          manager.create(PackageItem, {
            packageId: savedPkg.id,
            itemId: pi.itemId ?? null,
            groupId: pi.groupId ?? null,
            quantity_required: pi.quantity_required,
            item_type: pi.item_type,
          }),
        );
        await manager.save(lineItems);

        return manager.findOne(InventoryPackage, {
          where: { id: savedPkg.id },
          relations: ["packageItems", "packageItems.item", "packageItems.group"],
        });
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        data: inventoryPackageSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const { packageItems, ...packageData } = input.data;

      return await AppDataSource.transaction(async (manager) => {
        const pkg = await manager.findOneByOrFail(InventoryPackage, {
          id: input.id,
        });

        const cleanedData = Object.fromEntries(
          Object.entries(packageData).filter(([_, v]) => v !== undefined),
        );
        manager.merge(InventoryPackage, pkg, cleanedData);
        await manager.save(pkg);

        // Replace all line items atomically.
        await manager.delete(PackageItem, { packageId: input.id });

        const lineItems = packageItems.map((pi) =>
          manager.create(PackageItem, {
            packageId: input.id,
            itemId: pi.itemId ?? null,
            groupId: pi.groupId ?? null,
            quantity_required: pi.quantity_required,
            item_type: pi.item_type,
          }),
        );
        await manager.save(lineItems);

        return manager.findOne(InventoryPackage, {
          where: { id: input.id },
          relations: ["packageItems", "packageItems.item", "packageItems.group"],
        });
      });
    }),

  delete: protectedProcedure
    .input(z.number().int().positive())
    .mutation(async ({ input }) => {
      // PackageItems are deleted via CASCADE on the DB level.
      return await AppDataSource.getRepository(InventoryPackage).delete(input);
    }),
});
