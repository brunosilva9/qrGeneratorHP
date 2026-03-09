import QrCard from "./QrCard"

export default function SheetPreview({cards}){
  console.log(cards);
  return(

    <div className="sheet">

      {cards.slice(0,9).map(card=>(
        <QrCard
          key={card.code}
          code={card.code}
          qr={card.qr}
        />
      ))}

    </div>

  )
}