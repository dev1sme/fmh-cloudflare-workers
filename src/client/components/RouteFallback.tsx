import { Center, Loader } from "@mantine/core";

/**
 * What a route shows while its own chunk is still downloading.
 *
 * The same spinner `PageState` uses for a pending request, on purpose: a screen
 * that is fetching its code and a screen that is fetching its data are the same
 * wait to whoever is looking at it, so they should not look different.
 *
 * Deliberately not a skeleton of the screen. Once the chunk is cached this
 * never paints again, so a layout-accurate placeholder would be work almost
 * nobody sees.
 */
export function RouteFallback() {
  return (
    <Center py="xl">
      <Loader />
    </Center>
  );
}
