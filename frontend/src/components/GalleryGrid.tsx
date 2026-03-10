import Image from "next/image";

interface GalleryGridProps {
    images: { src: string; alt: string }[];
}

export default function GalleryGrid({ images }: GalleryGridProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {images.map((img, i) => (
                <div
                    key={i}
                    className={`relative overflow-hidden rounded-2xl group cursor-pointer ${i === 0 ? "col-span-2 row-span-2 h-64 md:h-96" : "h-40 md:h-48"
                        }`}
                >
                    <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-3 left-3 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {img.alt}
                    </div>
                </div>
            ))}
        </div>
    );
}
