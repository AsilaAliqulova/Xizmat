import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IBotCReationAttr {
  userId: number | undefined;
  username: string | undefined;
  first_name: string | undefined;
  last_name: string | undefined;
  lang: string | undefined;
  role: string | undefined;
  specialty: string | undefined;
  name: string | undefined;
  telefon: string | undefined;
  ustaxona: string | undefined;
  manzil: string | undefined;
  moljal: string | undefined;
  lokatsiya: string | undefined;
  boshlashVaqti: string | undefined;
  yakunlashVaqti: string | undefined;
  sarflanadiganVaqt: number | undefined;
  status:string|undefined
}
@Table({ tableName: "bot" })
export class Bot extends Model<Bot, IBotCReationAttr> {
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
  specialty: string | undefined;

  @Column({
    type: DataType.STRING,
    defaultValue: false,
  })
  status: string;

  @Column({
    type: DataType.STRING,
  })
  name: string | undefined;

  @Column({ type: DataType.STRING })
  telefon: string | undefined;

  @Column({ type: DataType.STRING })
  ustaxona: string | undefined;

  @Column({ type: DataType.STRING })
  manzil: string | undefined;

  @Column({ type: DataType.STRING })
  moljal: string | undefined;

  @Column({ type: DataType.STRING })
  lokatsiya: string | undefined;

  @Column({ type: DataType.STRING })
  boshlashVaqti: string | undefined;

  @Column({ type: DataType.STRING })
  yakunlashVaqti: string | undefined;

  @Column({ type: DataType.INTEGER })
  sarflanadiganVaqt: number | undefined;

  @Column({ type: DataType.STRING })
  step: string;
}
