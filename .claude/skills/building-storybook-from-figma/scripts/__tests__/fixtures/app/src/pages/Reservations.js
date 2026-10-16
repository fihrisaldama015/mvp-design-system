import Select from "components/select";
import { Button } from "components/button";

export default function Reservations() {
  return (
    <div>
      <Select name="item" searchable options={opts} />
      <Button onClick={() => a > b} kind="primary" />
    </div>
  );
}
