import os

def generate_icons():
    try:
        import pygame
        os.environ['SDL_VIDEODRIVER'] = 'dummy'
        pygame.init()
        size = 128
        surface = pygame.Surface((size, size), pygame.SRCALPHA)
        surface.fill((255, 253, 248, 255))
        pygame.draw.rect(surface, (0, 0, 0), (0, 0, 128, 128), width=3, border_radius=12)

        # Ears
        pygame.draw.rect(surface, (255, 230, 0), (16, 56, 10, 18), border_radius=3)
        pygame.draw.rect(surface, (0, 0, 0), (16, 56, 10, 18), width=3, border_radius=3)
        pygame.draw.rect(surface, (255, 230, 0), (102, 56, 10, 18), border_radius=3)
        pygame.draw.rect(surface, (0, 0, 0), (102, 56, 10, 18), width=3, border_radius=3)

        # Antenna
        pygame.draw.line(surface, (0, 0, 0), (64, 36), (64, 20), width=4)
        pygame.draw.circle(surface, (184, 122, 255), (64, 16), 6)
        pygame.draw.circle(surface, (0, 0, 0), (64, 16), 6, width=3)

        # Head
        pygame.draw.rect(surface, (255, 230, 0), (24, 36, 80, 70), border_radius=8)
        pygame.draw.rect(surface, (0, 0, 0), (24, 36, 80, 70), width=4, border_radius=8)

        # Forehead plate
        pygame.draw.rect(surface, (184, 122, 255), (48, 40, 32, 10), border_radius=3)
        pygame.draw.rect(surface, (0, 0, 0), (48, 40, 32, 10), width=2, border_radius=3)

        # Eyes
        pygame.draw.circle(surface, (125, 255, 179), (44, 64), 14)
        pygame.draw.circle(surface, (0, 0, 0), (44, 64), 14, width=3)
        pygame.draw.circle(surface, (125, 255, 179), (84, 64), 14)
        pygame.draw.circle(surface, (0, 0, 0), (84, 64), 14, width=3)

        # Eye crosshairs
        pygame.draw.circle(surface, (0, 0, 0), (44, 64), 5, width=2)
        pygame.draw.line(surface, (0, 0, 0), (44, 54), (44, 74), width=2)
        pygame.draw.line(surface, (0, 0, 0), (34, 64), (54, 64), width=2)
        pygame.draw.circle(surface, (0, 0, 0), (84, 64), 5, width=2)
        pygame.draw.line(surface, (0, 0, 0), (84, 54), (84, 74), width=2)
        pygame.draw.line(surface, (0, 0, 0), (74, 64), (94, 64), width=2)

        # Cheeks
        pygame.draw.rect(surface, (255, 144, 232), (26, 78, 10, 10), border_radius=2)
        pygame.draw.rect(surface, (0, 0, 0), (26, 78, 10, 10), width=2, border_radius=2)
        pygame.draw.rect(surface, (255, 144, 232), (92, 78, 10, 10), border_radius=2)
        pygame.draw.rect(surface, (0, 0, 0), (92, 78, 10, 10), width=2, border_radius=2)

        # Mouth
        pygame.draw.rect(surface, (255, 230, 0), (40, 86, 48, 12), border_radius=4)
        pygame.draw.rect(surface, (0, 0, 0), (40, 86, 48, 12), width=3, border_radius=4)
        pygame.draw.line(surface, (0, 0, 0), (52, 86), (52, 98), width=2)
        pygame.draw.line(surface, (0, 0, 0), (64, 86), (64, 98), width=2)
        pygame.draw.line(surface, (0, 0, 0), (76, 86), (76, 98), width=2)

        out_dir = os.path.join(os.path.dirname(__file__), '..', 'extension', 'icons')
        os.makedirs(out_dir, exist_ok=True)
        pygame.image.save(surface, os.path.join(out_dir, "icon128.png"))

        for s in [16, 32, 48]:
            scaled = pygame.transform.smoothscale(surface, (s, s))
            pygame.image.save(scaled, os.path.join(out_dir, f"icon{s}.png"))

        # Also copy logo.png
        pygame.image.save(surface, os.path.join(out_dir, '..', 'logo.png'))
        print("Generated icons: 16px, 32px, 48px, 128px and logo.png")
    except Exception as e:
        print(f"Error generating icons: {e}")

if __name__ == "__main__":
    generate_icons()
