import { Howl } from 'howler';

const SOUND_URLS = {
    send: '/pop.wav',
    receive: '/pop.wav',
    error: '/pop.wav',
    success: '/pop.wav',
};

const sounds: Record<string, Howl> = {};

if (typeof window !== 'undefined') {
    Object.entries(SOUND_URLS).forEach(([key, url]) => {
        sounds[key] = new Howl({
            src: [url],
            html5: true,
        });
    });
}

export const playSound = (type: keyof typeof SOUND_URLS) => {
    if (sounds[type]) {
        sounds[type].play();
    }
};

export const useSound = () => {
    return { playSound };
};
