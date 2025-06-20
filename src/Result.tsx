import React from 'react';
import atomDataJson from './atom.json';

type AtomDataType = {
  [key: string]: {
    symbol: string; //영어 명
    kor?: string; //한글 명
    atomic_mass: number; //원자량
  };
};

const atomData: AtomDataType = atomDataJson as AtomDataType;

interface ResultProps {
  parsedAtoms: { symbol: string; count: number }[];
  amount?: number | null;
  unit?: string;
}   

const AVOGADRO = 6.02 * 10**23; // 아보가드로 수

// 분자 하나당 원자의 개수를 계산
function getAtomCountPerMolecule(parsedAtoms: { symbol: string; count: number }[]) {
  return parsedAtoms.reduce((sum, atom) => sum + atom.count, 0);
}

const Result: React.FC<ResultProps> = ({ parsedAtoms, amount, unit }) => {
  if (!parsedAtoms || parsedAtoms.length === 0) return null;

  // 파싱 결과에서 숫자인지 문자인지 구분
  let moleculeCount = 1;
  let atomsForFormula = parsedAtoms;
  if (
    parsedAtoms.length > 0 &&
    typeof parsedAtoms[0].symbol === 'string' &&
    !isNaN(Number(parsedAtoms[0].symbol))
  ) {
    moleculeCount = Number(parsedAtoms[0].symbol);
    atomsForFormula = parsedAtoms.slice(1);
  }

  const formula = atomsForFormula
    .map(atom => {
      const mass = atomData[atom.symbol]?.atomic_mass ?? 0;
      return `${atom.count}×${mass}`;
    })
    .join(' + ');

  const total = atomsForFormula
    .reduce(
      (sum, atom) =>
        sum + ((atomData[atom.symbol]?.atomic_mass ?? 0) * atom.count),
      0
    );

  // 분자 하나당 원자의 개수
  const atomsPerMolecule = getAtomCountPerMolecule(parsedAtoms);

  // 단위별 계산 (단위가 허용되는지 and 양이 0보다 큰지)
  const isKg = (unit === 'kg') && amount && total > 0;
  const isG = (unit === 'g') && amount && total > 0;
  const isMol = (unit === 'mol' || unit === '몰' || unit === 'mole' || unit === 'MOL') && amount && total > 0;
  const isL = (unit === 'L' || unit === '리터') && amount && total > 0;
  const ismL = (unit === 'mL' || unit === '밀리리터') && amount && total > 0;
  const isNA = (unit === 'NA') && amount && total > 0;
  const amountInG = isKg ? amount * 1000 : amount; /* kg일 때 g으로 변환*/
  const amountInL = ismL ? (amount as number) / 1000 : amount; // mL일 때 L로 변환

  // 0도씨 1기압에서 1mol 기체의 부피(L)
  const MOLAR_VOLUME = 22.4;

  // g, kg → mol, L, NA
  let gToMol = null;
  let gToL = null;
  let gToNA = null;
  let gToAtomCount = null;
  if ((isG || isKg) && amountInG && total > 0) {
    gToMol = amountInG / total;
    gToL = gToMol * MOLAR_VOLUME;
    gToNA = gToMol * AVOGADRO;
    gToAtomCount = gToMol * atomsPerMolecule * AVOGADRO;
  }

  // mol → g, L, NA
  let molToG = null;
  let molToL = null;
  let molToNA = null;
  let molToAtomCount = null;
  if (isMol && amount) {
    molToG = amount * total;
    molToL = amount * MOLAR_VOLUME;
    molToNA = amount * AVOGADRO;
    molToAtomCount = amount * atomsPerMolecule * AVOGADRO;
  }

  // L, mL → mol, g, 원자수 계산
  let lToMol = null;
  let lToG = null;
  let lToAtomCount = null;
  if ((isL || ismL) && amountInL && total > 0) {
    lToMol = amountInL / MOLAR_VOLUME;
    lToG = lToMol * total;
    lToAtomCount = lToMol * atomsPerMolecule * AVOGADRO;
  }
  

  // NA → mol, g, L, 원자수
  let naToMol = null;
  let naToG = null;
  let naToL = null;
  let naToAtomCount = null;
  if (isNA && amount) {
    // 분자 하나당 원자의 개수 반영
    naToMol = amount * atomsPerMolecule; // ÷ AVOGADRO 제거
    naToG = naToMol * total;
    naToL = naToMol * MOLAR_VOLUME;
    naToAtomCount = amount * AVOGADRO * atomsPerMolecule;
  }


  return (
    <div style={{ marginTop: '16px', color: '#fff' }}>
      {/* 원자 정보 출력 */}
      {atomsForFormula.map((atom, idx) => (
        <div key={idx}>
          {atom.symbol}(
      {atomData[atom.symbol]?.symbol ?? '-'} {atomData[atom.symbol]?.kor ?? '-'}.
      원자량: {atomData[atom.symbol]?.atomic_mass ?? '-'}
    ) {atom.count * moleculeCount}개
    {moleculeCount > 1 ? ` (${atom.count}개 × ${moleculeCount})` : ''}
        </div>
      ))}
      <div style={{ marginTop: '12px', fontWeight: 'bold' }}>
        분자량(화학식량): 
        {moleculeCount > 1
          ? `${moleculeCount}(${atomsForFormula.map(atom => `${atom.count}×${atomData[atom.symbol]?.atomic_mass ?? 0}`).join(' + ')})`
          : atomsForFormula.map(atom => `${atom.count}×${atomData[atom.symbol]?.atomic_mass ?? 0}`).join(' + ')}
        <br />
        = {moleculeCount > 1
          ? `${moleculeCount}(${atomsForFormula.reduce((sum, atom) => sum + ((atomData[atom.symbol]?.atomic_mass ?? 0) * atom.count), 0).toFixed(3)}) = ${(atomsForFormula.reduce((sum, atom) => sum + ((atomData[atom.symbol]?.atomic_mass ?? 0) * atom.count), 0) * moleculeCount).toFixed(3)}`
          : atomsForFormula.reduce((sum, atom) => sum + ((atomData[atom.symbol]?.atomic_mass ?? 0) * atom.count), 0).toFixed(3)}
        <br /><br />
      </div>

      {/* mol 입력 시: 질량, 부피(L), 원자/분자 개수 모두 출력 */}
      {isMol && (
        <div style={{ marginTop: '12px', fontWeight: 'bold', color: '#82b2ff' }}>
          {/* 질량 */}
          질량 계산: 몰 수(mol) × 1몰의 질량(g/mol) = 질량(g)
          <br />
          {amount}mol × {total.toFixed(3)}g/mol = {molToG !== null ? molToG.toFixed(3) : '-'} g
          <br /><br />
          {/* 부피 */}
          (0℃, 1atm, 기체일 때)<br />
          부피 계산: 몰 수(mol) × 1몰의 부피(22.4L) = 부피(L)
          <br />
          {amount}mol × 22.4L = {molToL !== null ? molToL.toFixed(3) : '-'} L
          <br /><br />
          {/* 원자/분자 개수 */}
          원자의 개수 계산: 몰 수(mol) × 분자 하나당 원자의 개수 × 아보가드로 수(6.02×10²³) = 총 원자 개수
          <br />
          {amount && atomsPerMolecule
            ? `${amount} × ${atomsPerMolecule} × 6.02 × 10²³ = ${(Number(amount) * atomsPerMolecule * 6.02).toFixed(2)} × 10²³`
            : '-'}개
        </div>
      )}
      {/* g, kg 입력 시: 몰, 부피(L), 원자/분자 개수 모두 출력 */}
      {(isG || isKg) && (
        <div style={{ marginTop: '12px', fontWeight: 'bold', color: '#ffe082' }}>
          {/* 몰 수 */}
          몰 수 계산: 질량(g) ÷ 1몰의 질량(g/mol) = 몰 수(mol)
          <br />
          {amountInG}g ÷ {total.toFixed(3)}g/mol = {gToMol !== null ? gToMol.toFixed(4) : '-'} mol
          <br /><br />
          {/* 부피 */}
          (0℃, 1atm, 기체일 때)<br />
          부피 계산: 몰 수(mol) × 1몰의 부피(22.4L) = 부피(L)
          <br />
          {gToMol !== null ? gToMol.toFixed(4) : '-'} mol × 22.4L = {gToL !== null ? gToL.toFixed(3) : '-'} L
          <br /><br />
          {/* 원자/분자 개수 */}
          원자의 개수 계산: 몰 수(mol) × 분자 하나당 원자의 개수 × 아보가드로 수(6.02×10²³) = 총 원자 개수
          <br />
          {gToMol && atomsPerMolecule
            ? `${gToMol.toFixed(4)} × ${atomsPerMolecule} × 6.02 × 10²³ = ${(gToMol * atomsPerMolecule * 6.02).toFixed(2)} × 10²³`
            : '-'}개
        </div>
      )}
      {/* L, mL 입력 시: 몰, 질량, 원자/분자 개수 모두 출력 */}
      {(isL || ismL) && (
        <div style={{ marginTop: '12px', fontWeight: 'bold', color: '#ffd1dc' }}>
          (0℃, 1atm, 기체일 때)
          <br />
          {/* 몰 수 */}
          몰 수 계산: 부피(L) ÷ 1몰의 부피(22.4L) = 몰 수(mol)
          <br />
          {amountInL}L ÷ 22.4L = {lToMol !== null ? lToMol.toFixed(4) : '-'} mol
          <br /><br />
          {/* 질량 */}
          질량 계산: 몰 수(mol) × 1몰의 질량(g/mol) = 질량(g)
          <br />
          {lToMol !== null ? `${lToMol.toFixed(4)}mol × ${total.toFixed(3)}g/mol = ${lToG !== null ? lToG.toFixed(3) : '-'}` : '-'} g
          <br /><br />
          {/* 원자/분자 개수 */}
          원자의 개수 계산: 몰 수(mol) × 분자 하나당 원자의 개수 × 아보가드로 수(6.02×10²³) = 총 원자 개수
          <br />
          {lToMol && atomsPerMolecule
            ? `${lToMol.toFixed(4)} × ${atomsPerMolecule} × 6.02 × 10²³ = ${(lToMol * atomsPerMolecule * 6.02).toFixed(2)} × 10²³`
            : '-'}개
        </div>
      )}
      {/* NA 입력 시: 몰, 질량, 부피(L), 원자수 모두 출력 */}
      {isNA && (
        <div style={{ marginTop: '12px', fontWeight: 'bold', color: '#ffb347' }}>
          {/* 몰 수 */}
          몰 수 계산: 계수 × 분자 하나당 원자의 개수 = 몰 수(mol)
          <br />
          {amount} × {atomsPerMolecule} = {naToMol !== null ? Number(naToMol).toLocaleString(undefined, { maximumFractionDigits: 4 }) : '-'} mol
          <br /><br />
          {/* 질량 */}
          질량 계산: 몰 수(mol) × 1몰의 질량(g/mol) = 질량(g)
          <br />
          {naToMol !== null ? `${Number(naToMol).toLocaleString(undefined, { maximumFractionDigits: 4 })} mol × ${total.toFixed(3)}g/mol = ${naToG !== null ? naToG.toFixed(3) : '-'}` : '-'} g
          <br /><br />
          {/* 부피 */}
          (0℃, 1atm, 기체일 때)<br />
          부피 계산: 몰 수(mol) × 1몰의 부피(22.4L) = 부피(L)
          <br />
          {naToMol !== null ? `${Number(naToMol).toLocaleString(undefined, { maximumFractionDigits: 4 })} mol × 22.4L = ${naToL !== null ? naToL.toFixed(3) : '-'}` : '-'} L
          <br /><br />
          {/* 총 원자의 개수 */}
          총 원자의 개수: 입력한 NA의 계수 × 분자 하나당 원자의 개수 × 아보가드로 수 = {amount && atomsPerMolecule
            ? `${amount} × ${atomsPerMolecule} × 6.02 × 10²³ = ${(Number(amount) * atomsPerMolecule * 6.02).toFixed(2)} × 10²³`
            : '-'}개
          <br />
          {/* 입력한 NA의 계수 × 아보가드로 수 */}
          입력한 NA의 계수 × 아보가드로 수 = {amount ? `${amount} × 6.02 × 10²³ = ${(Number(amount) * 6.02).toFixed(2)} × 10²³` : '-'}
        </div>
      )}
      {/* mL 입력 시: 몰, 질량, 원자/분자 개수 모두 출력 */}  
    </div>
  );
};

export default Result;