export const centerGameObjects = (objects: any[]) => {
    objects.forEach(function (object) {
        object.anchor.setTo(0.5);
    });
};

export const setResponsiveWidth = (sprite: PIXI.Sprite, percent: number, parent: any) => {
    let percentWidth = (sprite.texture.width - (parent.width / (100 / percent))) * 100 / sprite.texture.width;
    sprite.width = parent.width / (100 / percent);
    sprite.height = sprite.texture.height - (sprite.texture.height * percentWidth / 100);
};

export function easeInOutQuart (t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
