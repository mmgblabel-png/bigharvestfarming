import pygame


def main():
    print("game_demo main() starting...")  # debug print

    pygame.init()
    screen = pygame.display.set_mode((800, 600))
    pygame.display.set_caption("Big Harvest Farming - TEST WINDOW")
    clock = pygame.time.Clock()

    running = True

    while running:
        dt = clock.tick(60) / 1000.0

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        # groene achtergrond
        screen.fill((40, 120, 50))
        pygame.display.flip()

    pygame.quit()
    print("game_demo main() finished.")


if __name__ == "__main__":
    main()
