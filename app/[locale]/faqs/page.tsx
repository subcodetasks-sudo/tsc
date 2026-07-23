import parse from "html-react-parser"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getTranslations } from "next-intl/server"
import { LegalPageShell } from "@/features/legal/components/legal-page-shell"
import { loadFaqs } from "@/features/legal/services/legal-content.service"
import { normalizeRichTextHtml } from "@/lib/rich-text"

async function getFallbackFaqs() {
  const contactT = await getTranslations("Landing.contact")

  return [
    {
      id: "fees",
      question: contactT("faq.items.fees.question"),
      answer: contactT("faq.items.fees.answer"),
    },
    {
      id: "language",
      question: contactT("faq.items.language.question"),
      answer: contactT("faq.items.language.answer"),
    },
    {
      id: "timeline",
      question: contactT("faq.items.timeline.question"),
      answer: contactT("faq.items.timeline.answer"),
    },
    {
      id: "documents",
      question: contactT("faq.items.documents.question"),
      answer: contactT("faq.items.documents.answer"),
    },
  ]
}

type Props = {
  params: Promise<{ locale: string }>
}

export default async function FaqsPage({ params }: Props) {
  const { locale } = await params
  const legalT = await getTranslations("Pages.legal.faq")
  const [apiFaqs, fallbackFaqs] = await Promise.all([loadFaqs(locale), getFallbackFaqs()])

  const faqs = apiFaqs.length > 0 ? apiFaqs : fallbackFaqs

  return (
    <LegalPageShell
      eyebrow={legalT("faq.eyebrow")}
      title={legalT("faq.title")}
      description={legalT("faq.description")}
      actions={[
        { href: "/contact", label: legalT("faq.contactAction") },
      ]}
    >
      <div className="rounded-[24px] border border-[#D4D4D4] bg-white px-4 py-2 sm:px-6">
        <Accordion type="single" defaultValue={faqs[0]?.id} collapsible className="w-full">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id} className="border-b border-[#D4D4D4] last:border-b-0">
              <AccordionTrigger className="py-4 text-left no-underline hover:no-underline">
                <div className="flex items-center gap-2 text-[18px] font-semibold leading-[1.6] text-[#262626]">
                  <span className="bg-[linear-gradient(270deg,#032C44_0%,#41A0CA_100%)] bg-clip-text text-[20px] font-extrabold text-transparent">
                    Q.
                  </span>
                  {faq.question}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-[16px] leading-[1.8] text-[#525252] [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:ps-5 [&_a]:text-[#006EA8] [&_a]:underline [&_strong]:font-semibold">
                {parse(normalizeRichTextHtml(faq.answer))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </LegalPageShell>
  )
}
