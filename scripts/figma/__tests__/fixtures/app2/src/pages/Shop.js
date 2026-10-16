import React from "react"
import {
  Select as S,
  Button
} from "components/select"

export default function Shop() {
  return (
    <div>
      <S {...rest} name="spread" />
      <S variant={v} name="dynamic" />
      <S variant="old" name="literal" />
    </div>
  )
}
