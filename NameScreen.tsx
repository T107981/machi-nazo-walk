import { useState, type FormEvent } from 'react';
import { DEFAULT_NAME, NAME_MAX, cleanName } from './storage';

type Props = {
  initial: string | null;
  /** 変更画面か（true なら「やめる」ボタンを出す） */
  canCancel: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
};

/** コードネーム（呼ばれる名前）を決める画面 */
export function NameScreen({ initial, canCancel, onSubmit, onCancel }: Props) {
  const [value, setValue] = useState(initial ?? '');
  const name = cleanName(value);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(name === '' ? DEFAULT_NAME : name);
  }

  return (
    <main className="screen name">
      <p className="eyebrow">ADJUSTER REGISTRATION</p>
      <h1 className="rules-title">コードネームを登録</h1>
      <p className="story">
        補正者は、本名を名乗りません。通信で呼ばれる名前を決めてください。
      </p>

      <form className="card answer-form" onSubmit={handleSubmit}>
        <label htmlFor="codename" className="label">
          コードネーム（{NAME_MAX}文字まで）
        </label>
        <input
          id="codename"
          type="text"
          lang="ja"
          value={value}
          maxLength={NAME_MAX}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={DEFAULT_NAME}
        />
        <p className="muted small">
          本名や個人が分かる名前は入れないでください。この名前は、このスマホの中だけに保存されます。
        </p>
        <button type="submit" className="btn primary">
          {name === '' ? `「${DEFAULT_NAME}」で決定` : `「${name}」で決定`}
        </button>
        {canCancel && (
          <button type="button" className="btn ghost" onClick={onCancel}>
            やめる
          </button>
        )}
      </form>
    </main>
  );
}
