import parse from "html-react-parser"
import { getTranslations } from "next-intl/server"
import { LegalPageShell } from "@/features/legal/components/legal-page-shell"
import { loadLegalPageContent } from "@/features/legal/services/legal-content.service"

const richTextClassName =
  "text-[16px] leading-[1.8] text-[#525252] [&_h2]:mt-6 [&_h2]:text-[20px] [&_h2]:font-bold [&_h2]:leading-[1.3] [&_h2]:text-[#171717] [&_h3]:mt-4 [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:text-[#171717] [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:ps-6 [&_li]:mb-1 [&_a]:text-[#006EA8] [&_a]:underline [&_strong]:font-semibold"

function renderLegalContent(content: string) {
  const trimmed = content.trim()
  if (!trimmed) return null

  if (trimmed.includes("<") && trimmed.includes(">")) {
    return <div className={richTextClassName}>{parse(trimmed)}</div>
  }

  return <p className={richTextClassName}>{trimmed}</p>
}

function buildFallbackSections() {
  return [
    {
      title: "Legal notice",
      content:
        "This page provides the legal information about the operator of this platform, including company details and regulatory disclosures.",
    },
  ]
}

type Props = {
  params: Promise<{ locale: string }>
}

export default async function LegalInformationPage({ params }: Props) {
  const { locale } = await params
  const legalT = await getTranslations("LegalPages")
  const apiContent = await loadLegalPageContent(locale, "legal-information")
  const sections = apiContent?.sections ?? buildFallbackSections()

  return (
    <LegalPageShell
      eyebrow={legalT("legalInformation.eyebrow")}
      title={legalT("legalInformation.title")}
      description={legalT("legalInformation.description")}
      actions={[
        { href: "/terms", label: legalT("legalInformation.termsAction") },
        { href: "/privacy", label: legalT("legalInformation.privacyAction") },
        { href: "/contact", label: legalT("legalInformation.contactAction") },
      ]}
    >
      <div className="space-y-4 rounded-[24px] border border-[#D4D4D4] bg-white px-4 py-6 sm:px-8">
        {sections.map((section) => (
          <section key={section.title} className="space-y-3 border-b border-[#E8E8E8] pb-5 last:border-b-0 last:pb-0">
            <h2 className="text-[20px] font-semibold text-[#171717]">{section.title}</h2>
            {renderLegalContent(section.content)}
          </section>
        ))}
      </div>
    </LegalPageShell>
  )
}
