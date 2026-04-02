import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color={colors.primary.DEFAULT} strokeWidth={2.5} />
          <Text style={[styles.backText, { color: colors.primary.DEFAULT }]}>{t("common.back")}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{t("legal.termsTitle")}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: colors.text.secondary }]}>
          {t("legal.effectiveDateLabel", { date: EFFECTIVE_DATE })}
        </Text>

        <P>{t("legal.terms.intro")}</P>

        <Section title={t("legal.terms.s1_title")}>
          <P>{t("legal.terms.s1_body")}</P>
        </Section>

        <Section title={t("legal.terms.s2_title")}>
          <P>{t("legal.terms.s2_intro")}</P>
          <Bullet>{t("legal.terms.s2_b1")}</Bullet>
          <Bullet>{t("legal.terms.s2_b2")}</Bullet>
          <Bullet>{t("legal.terms.s2_b3")}</Bullet>
          <Bullet>{t("legal.terms.s2_b4")}</Bullet>
        </Section>

        <Section title={t("legal.terms.s3_title")}>
          <P>{t("legal.terms.s3_body")}</P>
        </Section>

        <Section title={t("legal.terms.s4_title")}>
          <P>{t("legal.terms.s4_intro")}</P>
          <Bullet>{t("legal.terms.s4_b1")}</Bullet>
          <Bullet>{t("legal.terms.s4_b2")}</Bullet>
          <Bullet>{t("legal.terms.s4_b3")}</Bullet>
          <Bullet>{t("legal.terms.s4_b4")}</Bullet>
          <Bullet>{t("legal.terms.s4_b5")}</Bullet>
          <P>{t("legal.terms.s4_footer")}</P>
        </Section>

        <Section title={t("legal.terms.s5_title")}>
          <P>{t("legal.terms.s5_intro")}</P>
          <Bullet>{t("legal.terms.s5_b1")}</Bullet>
          <Bullet>{t("legal.terms.s5_b2")}</Bullet>
          <Bullet>{t("legal.terms.s5_b3")}</Bullet>
          <Bullet>{t("legal.terms.s5_b4")}</Bullet>
          <Bullet>{t("legal.terms.s5_b5")}</Bullet>
          <Bullet>{t("legal.terms.s5_b6")}</Bullet>
          <Bullet>{t("legal.terms.s5_b7")}</Bullet>
        </Section>

        <Section title={t("legal.terms.s6_title")}>
          <P>{t("legal.terms.s6_body")}</P>
        </Section>

        <Section title={t("legal.terms.s7_title")}>
          <P>{t("legal.terms.s7_body")}</P>
        </Section>

        <Section title={t("legal.terms.s8_title")}>
          <P>{t("legal.terms.s8_body")}</P>
        </Section>

        <Section title={t("legal.terms.s9_title")}>
          <P>{t("legal.terms.s9_body")}</P>
        </Section>

        <Section title={t("legal.terms.s10_title")}>
          <P>{t("legal.terms.s10_body")}</P>
        </Section>

        <Section title={t("legal.terms.s11_title")}>
          <P>{t("legal.terms.s11_body")}</P>
        </Section>

        <Section title={t("legal.terms.s12_title")}>
          <P>{t("legal.terms.s12_body")}</P>
        </Section>

        <Section title={t("legal.terms.s13_title")}>
          <P>{t("legal.terms.s13_body")}</P>
        </Section>

        <Section title={t("legal.terms.s14_title")}>
          <P>{t("legal.terms.s14_intro")}</P>
          <Bullet>
            {COMPANY} ({t("legal.privacy.companyCode")} {COMPANY_CODE})
          </Bullet>
          <Bullet>{ADDRESS}</Bullet>
          <Bullet>
            <Text style={{ color: colors.text.secondary }}>
              {t("legal.terms.contactEmailLabel")}{" "}
              <Text
                style={{ color: colors.primary.DEFAULT, textDecorationLine: "underline" }}
                onPress={() => Linking.openURL(`mailto:${EMAIL}`)}
              >
                {EMAIL}
              </Text>
            </Text>
          </Bullet>
          <Bullet>{t("legal.terms.s14_phone", { phone: PHONE })}</Bullet>
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
