CREATE SEQUENCE "public"."Product_inventoryNumber_seq";

ALTER TABLE "public"."Product"
ADD COLUMN "inventoryNumber" INTEGER;

WITH ordered_products AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS seq
    FROM "public"."Product"
)
UPDATE "public"."Product" AS product
SET "inventoryNumber" = ordered_products.seq
FROM ordered_products
WHERE product."id" = ordered_products."id";

SELECT setval(
    '"public"."Product_inventoryNumber_seq"',
    COALESCE((SELECT MAX("inventoryNumber") FROM "public"."Product"), 1),
    EXISTS (SELECT 1 FROM "public"."Product")
);

ALTER TABLE "public"."Product"
ALTER COLUMN "inventoryNumber" SET DEFAULT nextval('"public"."Product_inventoryNumber_seq"'),
ALTER COLUMN "inventoryNumber" SET NOT NULL;

CREATE UNIQUE INDEX "Product_inventoryNumber_key" ON "public"."Product"("inventoryNumber");
