import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IBotCReationAttr {
  userId: number | undefined;
  username: string | undefined;
  first_name: string | undefined;
  last_name: string | undefined;
  lang: string | undefined;
  role: string | undefined;
  name: string | undefined;
  telefon: string | undefined;
  manzil: string | undefined;
  status: string | undefined;
}
@Table({ tableName: "mijoz" })
export class Mijoz extends Model<Mijoz, IBotCReationAttr> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
  })
  userId: number;
  @Column({
    type: DataType.STRING,
  })
  username: string | undefined;
  @Column({
    type: DataType.STRING,
  })
  first_name: string | undefined;
  @Column({
    type: DataType.STRING,
  })
  last_name: string | undefined;
  @Column({
    type: DataType.STRING,
  })
  phone_number: string;
  @Column({
    type: DataType.STRING,
  })
  lang: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  role: string | undefined;
  @Column({
    type: DataType.STRING,
  })
  @Column({
    type: DataType.STRING,
  })
  name: string | undefined;

  @Column({ type: DataType.STRING })
  telefon: string | undefined;

  @Column({ type: DataType.STRING })
  manzil: string | undefined;

  @Column({ type: DataType.STRING })
  step: string;
}
