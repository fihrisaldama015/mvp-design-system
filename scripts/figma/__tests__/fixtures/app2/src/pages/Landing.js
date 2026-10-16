import React from "react"
import Sel from "components/select"

export default function Landing() {
  return (
    <div>
      <p>Don't miss this</p>
      <Sel name="landing" />
      {/* <Sel name="ghost-jsx" /> */}
      {
        // <Sel name="ghost-line" />
      }
      {/* it's a note */}
      <Sel name="after-comment" />
    </div>
  )
}
