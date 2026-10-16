import Select from "components/select";
import Picker from "./Picker";

export default function NewReservation() {
  return (
    <form>
      <Select name="item" searchable={false} size={size} />
      <Picker />
    </form>
  );
}
