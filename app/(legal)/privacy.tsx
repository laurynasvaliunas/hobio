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

function TableRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.tableLabel, { color: colors.text.primary }]}>{label}</Text>
      <Text style={[styles.tableValue, { color: colors.text.secondary }]}>{value}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Privacy Policy</Text>
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
          {COMPANY} ("we", "us", "our") operates the Hobio mobile application. This Privacy
          Policy explains what personal data we collect, how we use and protect it, and the
          rights you have under the General Data Protection Regulation (GDPR) and applicable
          Lithuanian law.{"\n\n"}
          By using Hobio you acknowledge that you have read and understood this Privacy Policy.
        </P>

        <Section title="1. Data Controller">
          <View style={[styles.table, { borderColor: colors.border }]}>
            <TableRow label="Company" value={COMPANY} />
            <TableRow label="Company code" value={COMPANY_CODE} />
            <TableRow label="Address" value={ADDRESS} />
            <TableRow label="Email" value={EMAIL} />
            <TableRow label="Phone" value={PHONE} />
          </View>
        </Section>

        <Section title="2. Data We Collect">
          <P>We collect and process the following categories of personal data:</P>

          <Text style={[styles.subheading, { color: colors.text.primary }]}>Account data</Text>
          <Bullet>Full name and email address (required for registration).</Bullet>
          <Bullet>Profile photo (optional).</Bullet>
          <Bullet>Role selection (participant, organiser, or parent/guardian).</Bullet>

          <Text style={[styles.subheading, { color: colors.text.primary }]}>Activity data</Text>
          <Bullet>Groups you join or create, sessions you attend, and preferences.</Bullet>
          <Bullet>Messages and communications sent within the platform.</Bullet>
          <Bullet>Ratings and reviews you submit.</Bullet>

          <Text style={[styles.subheading, { color: colors.text.primary }]}>Children's data (parents only)</Text>
          <Bullet>Children's first names and age ranges — used solely to match appropriate group recommendations. We do not collect children's email addresses or independent accounts.</Bullet>

          <Text style={[styles.subheading, { color: colors.text.primary }]}>Technical data</Text>
          <Bullet>Device type, operating system version, and app version.</Bullet>
          <Bullet>IP address and general location (country/city level) for fraud prevention.</Bullet>
          <Bullet>Crash logs and performance diagnostics.</Bullet>

          <Text style={[styles.subheading, { color: colors.text.primary }]}>Payment data</Text>
          <Bullet>Transaction references and payment status. Full card data is handled exclusively by our payment processor and is never stored on our servers.</Bullet>
        </Section>

        <Section title="3. How We Use Your Data">
          <P>We process your personal data for the following purposes and legal bases:</P>
          <View style={[styles.table, { borderColor: colors.border }]}>
            <TableRow label="Providing the Service" value="Contract performance (Art. 6(1)(b) GDPR)" />
            <TableRow label="Account management" value="Contract performance (Art. 6(1)(b) GDPR)" />
            <TableRow label="Transactional emails" value="Contract performance (Art. 6(1)(b) GDPR)" />
            <TableRow label="Push notifications" value="Consent (Art. 6(1)(a) GDPR)" />
            <TableRow label="Marketing emails" value="Consent (Art. 6(1)(a) GDPR)" />
            <TableRow label="Safety & fraud prevention" value="Legitimate interest (Art. 6(1)(f) GDPR)" />
            <TableRow label="App improvement & analytics" value="Legitimate interest (Art. 6(1)(f) GDPR)" />
            <TableRow label="Legal obligations" value="Legal obligation (Art. 6(1)(c) GDPR)" />
          </View>
        </Section>

        <Section title="4. Data Sharing">
          <P>
            We do not sell your personal data. We share data only with trusted processors who
            assist us in operating the Service:
          </P>
          <Bullet>
            <Text style={{ fontFamily: Fonts.semiBold }}>Supabase Inc.</Text>
            {" "}— database hosting and authentication (servers in EU regions where available).
          </Bullet>
          <Bullet>
            <Text style={{ fontFamily: Fonts.semiBold }}>Expo / Expo Go</Text>
            {" "}— push notification delivery and app distribution.
          </Bullet>
          <Bullet>
            <Text style={{ fontFamily: Fonts.semiBold }}>Payment processors</Text>
            {" "}— for handling in-app transactions securely.
          </Bullet>
          <P>
            All processors are bound by data processing agreements and are required to process
            your data only on our instructions and in compliance with GDPR.{"\n\n"}
            We may disclose data to law enforcement or regulatory authorities if required by law
            or to protect the rights, property, or safety of Hobio, our users, or others.
          </P>
        </Section>

        <Section title="5. International Transfers">
          <P>
            Some of our processors (e.g. Supabase) may process data outside the European
            Economic Area (EEA). Where this occurs, we ensure appropriate safeguards are in
            place, such as Standard Contractual Clauses (SCCs) approved by the European
            Commission, to protect your data to EEA standards.
          </P>
        </Section>

        <Section title="6. Data Retention">
          <P>
            We retain your personal data for as long as your account is active. If you delete
            your account, we will erase your personal data within 30 days, except where we
            are required to retain certain records under applicable law (e.g. financial records
            for tax purposes — up to 10 years under Lithuanian accounting law).{"\n\n"}
            Aggregated, anonymised analytics data may be retained indefinitely as it can no
            longer identify you.
          </P>
        </Section>

        <Section title="7. Your Rights">
          <P>Under the GDPR, you have the following rights regarding your personal data:</P>
          <Bullet>
            <Text style={{ fontFamily: Fonts.semiBold }}>Access</Text>
            {" "}— request a copy of the personal data we hold about you.
          </Bullet>
          <Bullet>
            <Text style={{ fontFamily: Fonts.semiBold }}>Rectification</Text>
            {" "}— request correction of inaccurate or incomplete data.
          </Bullet>
          <Bullet>
            <Text style={{ fontFamily: Fonts.semiBold }}>Erasure</Text>
            {" "}— request deletion of your personal data ("right to be forgotten"), subject to legal retention obligations.
          </Bullet>
          <Bullet>
            <Text style={{ fontFamily: Fonts.semiBold }}>Data portability</Text>
            {" "}— receive your data in a structured, machine-readable format and transfer it to another controller.
          </Bullet>
          <Bullet>
            <Text style={{ fontFamily: Fonts.semiBold }}>Restriction</Text>
            {" "}— request that we limit the processing of your data in certain circumstances.
          </Bullet>
          <Bullet>
            <Text style={{ fontFamily: Fonts.semiBold }}>Objection</Text>
            {" "}— object to processing based on legitimate interests, including direct marketing.
          </Bullet>
          <Bullet>
            <Text style={{ fontFamily: Fonts.semiBold }}>Withdraw consent</Text>
            {" "}— withdraw any consent you have given at any time, without affecting the lawfulness of prior processing.
          </Bullet>
          <P>
            To exercise any of these rights, contact us at{" "}
            <Text
              style={{ color: colors.primary.DEFAULT, textDecorationLine: "underline" }}
              onPress={() => Linking.openURL(`mailto:${EMAIL}`)}
            >
              {EMAIL}
            </Text>
            . We will respond within 30 days. You also have the right to lodge a complaint
            with the State Data Protection Inspectorate of Lithuania (VDAI) at{" "}
            <Text
              style={{ color: colors.primary.DEFAULT, textDecorationLine: "underline" }}
              onPress={() => Linking.openURL("https://vdai.lrv.lt")}
            >
              vdai.lrv.lt
            </Text>
            .
          </P>
        </Section>

        <Section title="8. Children's Privacy">
          <P>
            The Service is not directed at children under the age of 16. Users registering
            as parents may add basic information about their children (first name and age
            group) to facilitate appropriate group recommendations. We do not knowingly
            create independent accounts for children under 16, and we do not collect more
            information about children than is necessary for this purpose.{"\n\n"}
            If you believe a child under 16 has provided us with personal data without
            parental consent, please contact us at {EMAIL} and we will delete it promptly.
          </P>
        </Section>

        <Section title="9. Security">
          <P>
            We implement appropriate technical and organisational measures to protect your
            personal data against unauthorised access, alteration, disclosure, or destruction.
            These include encrypted data transmission (TLS), access controls, and regular
            security assessments.{"\n\n"}
            No method of electronic transmission or storage is 100% secure. While we strive
            to protect your data, we cannot guarantee absolute security.
          </P>
        </Section>

        <Section title="10. Changes to This Policy">
          <P>
            We may update this Privacy Policy from time to time. We will notify you of
            material changes through the App or by email at least 14 days before they take
            effect. The "Effective date" at the top of this page indicates when the current
            version was last revised.
          </P>
        </Section>

        <Section title="11. Contact Us">
          <P>
            For any privacy-related questions or to exercise your rights, please contact us:
          </P>
          <Bullet>{COMPANY} (company code {COMPANY_CODE})</Bullet>
          <Bullet>{ADDRESS}</Bullet>
          <Bullet>
            Email:{" "}
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
  subheading: { fontSize: 14, fontFamily: Fonts.semiBold, marginTop: 12, marginBottom: 4 },
  paragraph: { fontSize: 14, fontFamily: Fonts.regular, lineHeight: 22 },
  bulletRow: { flexDirection: "row", gap: 8, marginTop: 6, paddingRight: 8 },
  bulletDot: { fontSize: 14, lineHeight: 22, fontFamily: Fonts.bold, minWidth: 10 },
  bulletText: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, lineHeight: 22 },
  table: {
    marginTop: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  tableLabel: { fontSize: 13, fontFamily: Fonts.semiBold, width: 110 },
  tableValue: { flex: 1, fontSize: 13, fontFamily: Fonts.regular, lineHeight: 19 },
});
