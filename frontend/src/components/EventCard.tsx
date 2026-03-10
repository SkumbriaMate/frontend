import Image from "next/image";
import { Calendar, Clock } from "lucide-react";
import Link from "next/link";

interface EventCardProps {
  title: string; description: string;
  date: string; time: string; image: string; category: string;
}

export default function EventCard({ title, description, date, time, image, category }: EventCardProps) {
  return (
    <>
      <style>{`
        .ec{
          background:var(--card,#fdfcf9);border:1px solid var(--bd,#dedad2);
          border-radius:18px;overflow:hidden;
          box-shadow:0 1px 4px rgba(26,24,20,.07);
          transition:all .25s cubic-bezier(.4,0,.2,1);
        }
        .ec:hover{border-color:var(--bd-2,#c6c0b7);box-shadow:0 4px 14px rgba(26,24,20,.09);transform:translateY(-2px)}

        .ec-img{position:relative;height:176px;overflow:hidden;background:var(--bg-2,#ece8e0)}
        .ec-img img{object-fit:cover;transition:transform .55s cubic-bezier(.4,0,.2,1)}
        .ec:hover .ec-img img{transform:scale(1.04)}
        .ec-img-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(26,24,20,.25),transparent)}

        .ec-cat{
          position:absolute;top:12px;left:12px;
          padding:4px 10px;border-radius:99px;
          background:rgba(245,242,236,.88);backdrop-filter:blur(8px);
          color:var(--accent,#2e5e3e);font-size:10.5px;font-weight:700;
          letter-spacing:.04em;text-transform:uppercase;
          border:1px solid rgba(46,94,62,.14);
        }

        .ec-body{padding:18px 19px}
        .ec-title{
          font-family:'Fraunces',Georgia,serif;
          font-size:15.5px;font-weight:600;
          color:var(--ink,#1a1814);margin-bottom:7px;line-height:1.32;
          transition:color .15s;
        }
        .ec:hover .ec-title{color:var(--accent,#2e5e3e)}
        .ec-desc{
          font-size:12.5px;color:var(--ink-2,#48443d);line-height:1.62;
          margin-bottom:13px;
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
        }
        .ec-meta{display:flex;gap:13px;font-size:11.5px;color:var(--ink-3,#877f75);margin-bottom:15px}
        .ec-meta-item{display:flex;align-items:center;gap:4px}

        .ec-btn{
          display:block;text-align:center;
          padding:9px;border:1.5px solid var(--bd-2,#c6c0b7);
          border-radius:9px;font-size:12.5px;font-weight:600;
          color:var(--ink,#1a1814);text-decoration:none;
          transition:all .18s;
        }
        .ec-btn:hover{background:var(--accent,#2e5e3e);color:#fff;border-color:var(--accent,#2e5e3e)}
      `}</style>

      <div className="ec">
        <div className="ec-img">
          <Image src={image} alt={title} fill />
          <div className="ec-img-overlay" />
          <span className="ec-cat">{category}</span>
        </div>
        <div className="ec-body">
          <div className="ec-title">{title}</div>
          <div className="ec-desc">{description}</div>
          <div className="ec-meta">
            <span className="ec-meta-item"><Calendar size={12} />{date}</span>
            <span className="ec-meta-item"><Clock size={12} />{time}</span>
          </div>
          <Link href="/reserve" className="ec-btn">რეგისტრაცია</Link>
        </div>
      </div>
    </>
  );
}