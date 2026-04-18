-- CreateTable
CREATE TABLE "WebContentSection" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'general',
    "titulo" TEXT NOT NULL,
    "subtitulo" TEXT NOT NULL DEFAULT '',
    "descripcion" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebContentSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#000000',
    "titular" TEXT NOT NULL,
    "numeroCuenta" TEXT NOT NULL,
    "cci" TEXT NOT NULL DEFAULT '',
    "qrImageUrl" TEXT NOT NULL DEFAULT '',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebContentSection_tipo_idx" ON "WebContentSection"("tipo");

-- CreateIndex
CREATE INDEX "WebContentSection_activo_orden_idx" ON "WebContentSection"("activo", "orden");

-- CreateIndex
CREATE INDEX "PaymentMethod_activo_idx" ON "PaymentMethod"("activo");

-- CreateIndex
CREATE INDEX "PaymentMethod_nombre_idx" ON "PaymentMethod"("nombre");
