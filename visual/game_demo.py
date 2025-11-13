import pygame


WINDOW_WIDTH = 1024
WINDOW_HEIGHT = 768
BG_COLOR = (40, 120, 50)  # donkergroen, boerderij vibe :)


def main():
    pygame.init()
    screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    pygame.display.set_caption("Big Harvest Farming - Visual Test")
    clock = pygame.time.Clock()

    running = True

    while running:
        dt = clock.tick(60) / 1000.0  # dt in seconden

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        # achtergrond tekenen
        screen.fill(BG_COLOR)

        # HIER komen later planten/dieren/gebouwen

        pygame.display.flip()

    pygame.quit()


if __name__ == "__main__":
    main()
