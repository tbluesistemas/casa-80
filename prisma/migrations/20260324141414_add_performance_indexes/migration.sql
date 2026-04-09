-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_startDate_idx" ON "Event"("startDate");

-- CreateIndex
CREATE INDEX "Event_endDate_idx" ON "Event"("endDate");

-- CreateIndex
CREATE INDEX "Event_clientId_idx" ON "Event"("clientId");

-- CreateIndex
CREATE INDEX "EventHistory_eventId_idx" ON "EventHistory"("eventId");

-- CreateIndex
CREATE INDEX "EventItem_productId_idx" ON "EventItem"("productId");

-- CreateIndex
CREATE INDEX "EventItem_eventId_idx" ON "EventItem"("eventId");

-- CreateIndex
CREATE INDEX "InventoryLog_productId_idx" ON "InventoryLog"("productId");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");
