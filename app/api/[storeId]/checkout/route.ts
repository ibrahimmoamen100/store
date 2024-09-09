import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  const { productIds, userPhoneNumber, userAddress } = await req.json();

  if (!productIds || productIds.length === 0) {
    return new NextResponse("Product ids are required", { status: 400 });
  }

  const products = await prismadb.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
  });

  if (products.length === 0) {
    return new NextResponse("No products found", { status: 404 });
  }

  // Format product details into a message
  const productDetails = products
    .map((product) => `${product.name} - $${product.price}`)
    .join(", ");

  // WhatsApp message content
  const message = `Hello, I would like to order the following products: ${productDetails}. My address is: ${userAddress}.`;

  // Replace with the actual WhatsApp number you want to send the message to
  const whatsappNumber = "201024911062"; // Example: +20 123 456 7890

  // Construct the WhatsApp URL
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;

  // Optionally, save the order to the database
  await prismadb.order.create({
    data: {
      storeId: params.storeId,
      isPaid: false, // Set as false since this isn't a Stripe transaction
      orderItems: {
        create: productIds.map((productId: string) => ({
          product: {
            connect: {
              id: productId,
            },
          },
        })),
      },
    },
  });

  // Return the WhatsApp URL for redirection
  return NextResponse.json(
    { url: whatsappUrl },
    {
      headers: corsHeaders,
    }
  );
}
