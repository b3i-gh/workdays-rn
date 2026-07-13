export function calcTaxesFromGross(gross: number) {
  const redditoImponibile = gross * 0.67;
  const impostaSostitutiva = redditoImponibile * 0.05;
  const contributiInps = redditoImponibile * 0.2607;
  const net = gross - impostaSostitutiva - contributiInps;

  return {
    redditoImponibile,
    impostaSostitutiva,
    contributiInps,
    net,
  };
}
git 