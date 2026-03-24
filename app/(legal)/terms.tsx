import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/hooks/useTheme";
import { Fonts } from "../../src/constants/fonts";

const EFFECTIVE_DATE = "24 March 2026";
const COMPANY = "Clyzio MB";
const COMPANY_CODE = "307107260";
const ADDRESS = "Polocko g. 2-2, LT-01204 Vilnius, Lithuania";
const EMAIL = "info@clyzio.com";
const PHONE = "+370 615 41336";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.primary.DEFAULT }]}>{title}</Text>
      {children}
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <Text style={[styles.paragraph, { color: colors.text.secondary }]}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletDot, { color: colors.primary.DEFAULT }]}>•</Text>
      <Text style={[styles.bulletText, { color: colors.text.secondary }]}>{children}</Text>
    </View>
  );
}

export default function TermsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color={colors.primary.DEFAULT} strokeWidth={2.5} />
          <Text style={[styles.backText, { color: colors.primary.DEFAULT }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Terms &amp; Conditions</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.lastUpdated, { color: colors.text.secondary }]}>
          Effective date: {EFFECTIVE_DATE}
        </Text>

        <P>
          These Terms and Conditions ("Terms") govern your access to and use of the Hobio mobile
          application ("App") and related services ("Service") operated by {COMPANY}, a company
          registered in the Republic of Lithuania under company code {COMPANY_CODE}, with registered
          address at {ADDRESS} ("we", "us", or "our").{"\n\n"}
          By creating an account or using the Service, you confirm that you have read, understood,
          and agree to be bound by these Terms. If you do not agree, please do not use the Service.
        </P>

        <Section title="1. The Service">
          <P>
            Hobio is a community activity management platform that enables individuals and
            organisations ("Organisers") to create, manage, and promote hobby groups, sessions,
            and events, and allows participants ("Members") to discover and join these activities.
          </P>
        </Section>

        <Section title="2. Eligibility">
          <P>To use the Service you must:</P>
          <Bullet>Be at least 16 years old, or have verifiable parental/guardian consent if younger.</Bullet>
          <Bullet>Provide accurate, current, and complete registration information.</Bullet>
          <Bullet>Maintain the security of your account credentials.</Bullet>
          <Bullet>Not be prohibited from using the Service under applicable law.</Bullet>
        </Section>

        <Section title="3. Accounts">
          <P>
            You are responsible for all activity that occurs under your account. You must notify us
            immediately at {EMAIL} if you suspect any unauthorised use. We reserve the right to
            suspend or terminate accounts that violate these Terms.
          </P>
        </Section>

        <Section title="4. Organiser Responsibilities">
          <P>
            Organisers who create groups or sessions on Hobio accept additional obligations:
          </P>
          <Bullet>Ensure all group information (description, schedules, fees, age limits) is accurate and kept up to date.</Bullet>
          <Bullet>Comply with all applicable laws, including consumer protection, health and safety, and data protection regulations.</Bullet>
          <Bullet>Obtain all necessary licences, permits, and insurance required to run their activities.</Bullet>
          <Bullet>Treat participants fairly and without discrimination.</Bullet>
          <Bullet>Promptly communicate any cancellations, changes, or relevant updates to registered participants.</Bullet>
          <P>
            We act solely as a platform intermediary. We are not responsible for the quality,
            safety, legality, or any aspect of activities organised by third-party Organisers.
          </P>
        </Section>

        <Section title="5. Acceptable Use">
          <P>You agree not to:</P>
          <Bullet>Post false, misleading, or harmful content.</Bullet>
          <Bullet>Harass, abuse, threaten, or discriminate against other users.</Bullet>
          <Bullet>Use the App for any unlawful purpose or in violation of any regulations.</Bullet>
          <Bullet>Attempt to gain unauthorised access to any part of the Service or its infrastructure.</Bullet>
          <Bullet>Scrape, crawl, or systematically extract data from the App.</Bullet>
          <Bullet>Use automated means to interact with the Service without our written permission.</Bullet>
          <Bullet>Upload malicious code, viruses, or any harmful software.</Bullet>
        </Section>

        <Section title="6. Payments and Fees">
          <P>
            Certain features or group memberships may require payment. All fees are stated in
            euros (EUR) and include applicable VAT unless stated otherwise. Payments are
            processed through secure third-party payment processors. We do not store your full
            payment card details.{"\n\n"}
            Refund policies for paid group sessions are set by the respective Organiser. We
            encourage you to review these before payment. In cases of technical billing errors
            attributable to us, we will issue a full refund.
          </P>
        </Section>

        <Section title="7. Intellectual Property">
          <P>
            The Hobio name, logo, design, and all content created by us are the intellectual
            property of {COMPANY} and may not be reproduced without our prior written consent.{"\n\n"}
            By submitting content (e.g. profile photos, group descriptions) to the App, you grant
            us a non-exclusive, worldwide, royalty-free licence to display and use that content
            solely for the purpose of operating the Service.
          </P>
        </Section>

        <Section title="8. Third-Party Services">
          <P>
            The Service may integrate with or link to third-party services (e.g. mapping services,
            payment processors). We are not responsible for the content, privacy practices, or
            availability of such third-party services.
          </P>
        </Section>

        <Section title="9. Disclaimers">
          <P>
            The Service is provided on an "as is" and "as available" basis. To the fullest extent
            permitted by law, we disclaim all warranties, express or implied, including
            merchantability, fitness for a particular purpose, and non-infringement.{"\n\n"}
            We do not guarantee that the App will be uninterrupted, error-free, or free from
            viruses. You use the Service at your own risk.
          </P>
        </Section>

        <Section title="10. Limitation of Liability">
          <P>
            To the extent permitted by Lithuanian law, {COMPANY} shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages arising from your
            use of, or inability to use, the Service — including damages for loss of profits,
            goodwill, data, or other intangible losses — even if we have been advised of the
            possibility of such damages.{"\n\n"}
            Our total cumulative liability shall not exceed the greater of (i) the fees you paid
            to us in the 12 months preceding the claim, or (ii) €50 EUR.
          </P>
        </Section>

        <Section title="11. Termination">
          <P>
            You may close your account at any time via the App settings. We reserve the right
            to suspend or permanently terminate your access if you breach these Terms, without
            prior notice and without liability to you.{"\n\n"}
            Upon termination, your right to use the Service ceases immediately. Provisions that
            by their nature should survive termination (including intellectual property, disclaimers,
            limitation of liability) shall continue to apply.
          </P>
        </Section>

        <Section title="12. Changes to These Terms">
          <P>
            We may update these Terms from time to time. We will notify you of material changes
            through the App or by email at least 14 days before they take effect. Your continued
            use of the Service after the effective date constitutes acceptance of the revised Terms.
          </P>
        </Section>

        <Section title="13. Governing Law and Disputes">
          <P>
            These Terms are governed by the laws of the Republic of Lithuania. Any disputes
            arising from or in connection with these Terms shall be subject to the exclusive
            jurisdiction of the courts of Vilnius, Lithuania, unless mandatory consumer
            protection laws in your country of residence provide otherwise.{"\n\n"}
            EU consumers may also use the European Online Dispute Resolution (ODR) platform
            at https://ec.europa.eu/odr.
          </P>
        </Section>

        <Section title="14. Contact Us">
          <P>
            If you have any questions about these Terms, please contact us:
          </P>
          <Bullet>{COMPANY} (company code {COMPANY_CODE})</Bullet>
          <Bullet>{ADDRESS}</Bullet>
          <Bullet
          >Email:{" "}
            <Text
              style={{ color: colors.primary.DEFAULT, textDecorationLine: "underline" }}
              onPress={() => Linking.openURL(`mailto:${EMAIL}`)}
            >
              {EMAIL}
            </Text>
          </Bullet>
          <Bullet>Phone: {PHONE}</Bullet>
        </Section>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, width: 60 },
  backText: { fontSize: 15, fontFamily: Fonts.semiBold },
  headerTitle: { fontSize: 17, fontFamily: Fonts.bold },
  scroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  lastUpdated: { fontSize: 13, fontFamily: Fonts.regular, marginBottom: 20 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontFamily: Fonts.bold, marginBottom: 10 },
  paragraph: { fontSize: 14, fontFamily: Fonts.regular, lineHeight: 22 },
  bulletRow: { flexDirection: "row", gap: 8, marginTop: 6, paddingRight: 8 },
  bulletDot: { fontSize: 14, lineHeight: 22, fontFamily: Fonts.bold, minWidth: 10 },
  bulletText: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, lineHeight: 22 },
});
