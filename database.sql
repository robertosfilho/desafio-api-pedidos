CREATE TABLE "Order" (
    "orderId" VARCHAR(50) PRIMARY KEY,
    "value" NUMERIC NOT NULL,
    "creationDate" TIMESTAMP NOT NULL
);

CREATE TABLE "Items" (
    id SERIAL PRIMARY KEY,
    "orderId" VARCHAR(50) REFERENCES "Order"("orderId") ON DELETE CASCADE,
    "productId" VARCHAR(50) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" NUMERIC NOT NULL
);