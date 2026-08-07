import { Button, Code, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

/**
 * Anything the role's route table does not match.
 *
 * This covers two cases on purpose without telling them apart: a path that
 * exists for nobody, and a path that exists for the other role. Saying which
 * would leak the manager's route names to a tenant, and the way out is the
 * same either way.
 */
export function NotFoundPage({ home }: { home: string }) {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  return (
    <Stack align="center" justify="center" mih="60vh" gap="xs" ta="center">
      <Title order={1} c="dimmed" fz={64} lh={1}>
        404
      </Title>
      <Title order={3}>{t("notFound.title")}</Title>

      <Text c="dimmed" maw={420}>
        {t("notFound.body")}
      </Text>
      <Code>{pathname}</Code>

      <Button component={Link} to={home} mt="md">
        {t("common.home")}
      </Button>
    </Stack>
  );
}
