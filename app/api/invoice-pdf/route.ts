import { NextRequest, NextResponse } from "next/server"
import jsPDF from "jspdf"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function GET(request: NextRequest) {
  const invoiceId = request.nextUrl.searchParams.get("id")
  if (!invoiceId) {
    return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
  }

  try {
    const invoiceRes = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`)
    if (!invoiceRes.ok) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }
    const invoice = await invoiceRes.json()

    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("INVOICE", 105, 20, { align: "center" })

    doc.setFontSize(12)
    doc.text(`Invoice No: ${invoice.invoice_number}`, 20, 40)
    doc.text(`Period: ${invoice.period_start} ~ ${invoice.period_end}`, 20, 48)

    doc.setFontSize(10)
    const startY = 65
    doc.setFillColor(240, 240, 240)
    doc.rect(20, startY, 170, 8, "F")
    doc.text("Item Name", 25, startY + 6)
    doc.text("Qty", 120, startY + 6)
    doc.text("Unit Price", 140, startY + 6)
    doc.text("Subtotal", 170, startY + 6)

    let currentY = startY + 15
    const items: Array<{ item_name: string; quantity: number; unit_price: number; subtotal: number }> = invoice.items
    items.forEach((item, index) => {
      if (currentY > 270) {
        doc.addPage()
        currentY = 20
      }

      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(20, currentY - 5, 170, 8, "F")
      }

      const itemName = item.item_name.length > 40 ? item.item_name.substring(0, 40) + "..." : item.item_name
      doc.text(itemName, 25, currentY)
      doc.text(item.quantity.toString(), 120, currentY)
      doc.text(`¥${Number(item.unit_price).toLocaleString()}`, 140, currentY)
      doc.text(`¥${Number(item.subtotal).toLocaleString()}`, 170, currentY)

      currentY += 10
    })

    currentY += 10
    doc.setLineWidth(0.5)
    doc.line(20, currentY, 190, currentY)
    currentY += 10
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Total:", 140, currentY)
    doc.text(`¥${Number(invoice.total_amount).toLocaleString()}`, 170, currentY)

    const pdfBuffer = doc.output("arraybuffer")
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
